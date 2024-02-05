import { LightningElement, api, wire, track } from "lwc";
import { reduceErrors } from 'c/ldsUtils';
import { refreshApex } from '@salesforce/apex';
import { subscribe, MessageContext } from 'lightning/messageService';
import GeneralCommunications_Channel from '@salesforce/messageChannel/GeneralCommunications__c';
import getCMTConfig from "@salesforce/apex/HierarchyController.getCMTConfig";
import getHierarchyRecords from "@salesforce/apex/HierarchyController.getHierarchyRecords";
import getHierarchyStartRecord from "@salesforce/apex/HierarchyController.getHierarchyStartRecord";
import getSObjectHierarchy from "@salesforce/apex/HierarchyController.getSObjectHierarchy";
import getPeerRecords from "@salesforce/apex/HierarchyController.getPeerRecords";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import FORM_FACTOR from "@salesforce/client/formFactor";

const TOAST_ERROR_TITLE = "Error occured!";
const ERROR_VARIANT = "error";

export default class HierarchyBase extends LightningElement {
	
	// API and component property variables
	@api configId = 'None'; // Default to "None". Overwritten if a value is provided in the "Select Configuration" property of this component.
	@api flexipageRegionWidth;
	@api objectApiName;
	@api pageTitle = 'Record Hierarchy'; // Default to "Record Hierarchy". Overwritten if a value is provided in the "Title" property of this component.
	@api recordId;

	// Hierarchy variables
	childRecords;
	currentRecord;
	parentRecords;
	hierarchyData;
	hierarchyRecordId;
	highestHierarchyRecordId;
	leftPeerArray;
	peerRecords;
	rightPeerArray;


	// Configuration record variables
	configDataError;
	configMetadata;
	hierarchyObject;
	highestHierarchyRecordId;
	queryString;
	refObjNameFields;
	relationField;
	searchDisplayField;
	wiredHierarchyRecordsResult;
	visualType;

	// UI Variables
	isRendered;
	loaded = false;
	refreshData = false;
	resetToStart = false;


	/* original variables */
	@track showParents = true;
	childRecords;
	@track parentHierarchy;
	allhierarchy = false;
	error;
	@track elementWidth;
	@track showAllMobile = false;
	@track viewAllChildRecords = false;


	get showViewAll() {
		return ((FORM_FACTOR === "Large" || this.showAllMobile) && this.hierarchyData?.childRecords?.length > 0);
	}

	connectedCallback() {
		window.addEventListener("resize", this.setComponentContainerWidth.bind(this));
		this.subscribeToMessageChannel();
	}

	renderedCallback() {
		if (this.isRendered) {
			return;
		}
		this.setComponentContainerWidth(); // Set the component container to the width of the user's screen.
		this.isRendered = true;
	}

	@wire(MessageContext)
	messageContext;

	@wire(getCMTConfig, {cmtConfigRecordId: "$configId"}) // Get the hierarchy configuraton record details from this component's configuration property parameter.
	wiredCMTConfigDetails(result) {
		console.log('1. Get CMT config record.');
		this.wiredCMTConfigRecordResult = result;
		const {data, error} = result;
		if (data) {
			const formattedData = JSON.parse(data);
			this.configMetadata = JSON.parse(formattedData.metadata);
			this.hierarchyObject = formattedData.hierarchyObject;
			this.queryString = formattedData.queryString;
			this.refObjNameFields = JSON.parse(formattedData.refObjNameFields);
			this.relationField = formattedData.relationField;
			this.searchDisplayField = formattedData.searchField;
			this.visualType = formattedData.visualType;
			if (formattedData.hierarchyLocation == 'Component Object Same As Hierarchy Object') { // Hierarchy is displayed on the same object that makes up the hierarchy.
				this.hierarchyRecordId = this.recordId; // Use record id as starting hierarchy record.
				this.highestHierarchyRecordId = this.hierarchyRecordId; // Store a static copy of the highest hierarchy record id.
			} else if (formattedData.hierarchyLocation == 'Component Object Different Than Hierarchy Object') { // Hierarchy is displayed on a different object than makes up the hierarchy.
				let componentRecordId = this.recordId;
				let recordMatchingField = formattedData.recordMatchingField;
				let highestRecordQueryString = 'SELECT Id FROM ' + this.hierarchyObject +' WHERE Hierarchy_Start_Record__c = true AND ' + recordMatchingField + ' = \'' + componentRecordId + '\'';
				this.getHighestHierarchyRecord(highestRecordQueryString); // Use related record id as starting hierarchy record.
			}
		} else if (error) {
			if (error.body.message == 'Value provided is invalid for action parameter \'configId\' of type \'Id\'' && this.configId == 'None') {
				this.configDataError = {
					name: 'No Hierarchy Configuration Selected',
					message: 'Edit this lightning page and select a hierarchy configuration record under the \"Select Configuration\" component property.',
					code: 100
				};
				console.log('Error no hierarchy configuration record selected: ' + reduceErrors(error));
			} else {
				this.configDataError = JSON.parse(error.body.message);
				console.log('Failed to retrieve hierarchy configuration record: ' + reduceErrors(error));
			}
		}
	}

	getHighestHierarchyRecord(highestRecordQueryString) {
		getHierarchyStartRecord({startRecordQueryString: highestRecordQueryString})
		.then(results => {
			if (results) {
				console.log('2. Get hierarchy start record.');
				if (results.length > 0) {
					this.hierarchyRecordId = results[0].Id; // Use returned record id as starting hierarchy record.
					this.highestHierarchyRecordId = this.hierarchyRecordId; // Store a static copy of the highest hierarchy record id.
				} else {
					this.configDataError = {
						name: 'No hierarchy start record found.',
						message: 'In order to display a hierarchy, one hierarchy record must be identified as the hierarchy start record.',
						code: 100
					};
				}
			}
		})
		.catch(error => {
			this.dispatchEvent(
				new ShowToastEvent({
					title: 'Error',
					message: 'Error retrieving highest hierarchy record: ' + reduceErrors(error),
					variant: 'error'
				})
			);
			console.log('Error retrieving highest hierarchy record: ' + reduceErrors(error));
		});
	}

	@wire(getHierarchyRecords, {queryString: "$queryString", relationField: "$relationField", currentRecId: "$hierarchyRecordId", refreshData: "$refreshData", resetToStart: "$resetToStart"}) // Once relation field is identified, or current record id is changed, get related records.
	wiredHierarchyRecords(result) {
		console.log('3. Get hierarchy records.');
		this.wiredHierarchyRecordsResult = result;
		this.hierarchyData = undefined;
		const {data, error} = result;
		if (data) {
			this.loaded = true;
			this.hierarchyData = JSON.parse(data);
			this.childRecords = this.hierarchyData.childRecords;
			this.currentRecord = this.hierarchyData.currentRecord;
			this.parentRecords = this.hierarchyData.parentRecords;
			console.log('3. HIERARCHY DATA: ' , this.hierarchyData);
			console.log('3. CHILD RECORDS: ' , this.childRecords);
			console.log('3. CURRENT RECORD: ' , this.currentRecord);
			console.log('3. PARENT RECORDS: ' , this.parentRecords);
			this.getPeers();
			this.allhierarchy = false;
		} else if (error) {
			this.dispatchEvent(
				new ShowToastEvent({
					title: 'Error',
					message: 'Error retrieving related records: ' + reduceErrors(error),
					variant: 'error'
				})
			);
			console.log('Error retrieving related records: ' + reduceErrors(error));
		}
	}

	getPeers() {
		console.log('4. Get peers.');
		const PARENT_RECORD_ID = this.hierarchyData.currentRecord[0][this.relationField]; // Use the lookup relationship field to get the id of the parent (if any) of the current hierarchy tile.
		let sameParentIdx;
		console.log('4. Current Tile Parent Id: ' + PARENT_RECORD_ID);
		if (PARENT_RECORD_ID == null) {
			this.peerRecords = undefined;
		}
		if (this.peerRecords) { // If there are peer records to the currently selected tile...
			sameParentIdx = this.peerRecords.findIndex((item) => item[this.relationField] === PARENT_RECORD_ID); // ...set index variable to 0 for matching peer record to focus tile.
		}
		if (!this.peerRecords || sameParentIdx === -1) { // If there are no peer records, or the currently selected tile does not share the same parent as the previoulsy selected tile...
			console.log('User selected a tile that does not share the same parent as the previous tile.');
			this.splitPeers([]);
			this.loaded = false;
			getPeerRecords({ queryString: this.queryString, relationField: this.relationField, parentRecordId: PARENT_RECORD_ID, currentRecId: this.hierarchyRecordId })
			.then((result) => {
				let peers = result;
				this.splitPeers(peers);
				this.loaded = true;
				console.log('4. PEER DATA: ', JSON.parse(JSON.stringify(this.peerRecords)));
			})
			.catch((error) => {
				this.error = error;
				this.peerRecords = undefined;
				this.leftPeerArray = undefined;
				this.rightPeerArray = undefined;
				this.dispatchEvent(
					new ShowToastEvent({
					title: TOAST_ERROR_TITLE,
					message: error.message,
					variant: ERROR_VARIANT
					})
				);
			});
		} else {
			console.log('User selected a tile that shares the same parent as the previous tile.');
		}
	}

	splitPeers(peers) {
		console.log('5. Split peers.');
		this.peerRecords = peers;
		let arrLength = this.peerRecords.length;
		this.leftPeerArray = this.peerRecords.slice(0, Math.floor(arrLength / 2));
		this.rightPeerArray = this.peerRecords.slice(Math.floor(arrLength / 2));
	}

	loadParents(id) {
		getSObjectHierarchy({ queryString: this.queryString, relationField: this.relationField, recordId: id })
		.then((result) => {
			if (this.parentHierarchy) {
				this.transformObj = JSON.parse( JSON.stringify(this.parentHierarchy)).reverse();
				Array.prototype.push.apply(result.reverse(), this.transformObj);
				this.parentHierarchy = result.reverse();
			} else {
				this.parentHierarchy = result;
			}
			this.loaded = true;
		})
		.catch((error) => {
			this.error = error;
			this.contacts = undefined;
			this.dispatchEvent(
				new ShowToastEvent({
					title: TOAST_ERROR_TITLE,
					message: error.message,
					variant: ERROR_VARIANT
				})
			);
		});
	}

	handleRecordSelect(event) {
		if (this.showAllMobile) {
			this.showAllMobile = false;
		}
		this.hierarchyRecordId = event.detail;
		console.log('Selected Tile Id: ' + this.hierarchyRecordId);
	}

	handleRefreshData() {
		this.refreshData = true;
		refreshApex(this.wiredHierarchyRecordsResult);
		if (this.resetToStart) {
			this.hierarchyRecordId = this.highestHierarchyRecordId;
		}
		this.refreshData = false;
		this.resetToStart = false;
		this.peerRecords = undefined;
	}

	handleResetData() {
		this.resetToStart = true;
		this.handleRefreshData();
	}

	handleRefreshevent(event) {
		this.allhierarchy = true;
		this.parentHierarchy = null;
		if (event.detail) {
			this.loadParents(event.detail);
		}
	}

	showHierarchy(event) {
		this.allhierarchy = true;
		this.loaded = false;
		if (event.detail.Source === "parentComponent") {
			this.parentHierarchy = null;
		}
		if (event.detail.Id) {
			this.loadParents(event.detail.Id);
		}
	}

	handleHomeEvent(event) {
		this.allhierarchy = false;
		if (event.detail) {
		this.loadParents(event.detail);
		}
	}

	handleParentVisibility(event) {
		this.showParents = event.detail;
	}

	handleShowParents() {
		this.showAllMobile = false;
		this.showParents = true;
	}

	showMoreItems() {
		if (FORM_FACTOR === "Large") {
			this.template.querySelector("c-hierarchy-view-all-child-records").openModal();
		} else if (FORM_FACTOR === "Small" || FORM_FACTOR === "Medium") {
			this.showAllMobile = true;
			this.showParents = false;
		}
	}

	setComponentContainerWidth() {
		this.elementWidth = this.template.querySelector(".hierarchyContainerMain").clientWidth;
	}

	subscribeToMessageChannel() {
		this.subscription = subscribe(
			this.messageContext,
			GeneralCommunications_Channel,
			(message) => this.handleMessage(message)
		);
	}

	handleMessage(message) {
		if (message.messageString == 'accountorgrolesupdated') {
			this.handleRefreshData();
		}
	}
}