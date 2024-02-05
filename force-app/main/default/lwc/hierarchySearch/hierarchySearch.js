import { LightningElement, wire, track, api } from "lwc";
import searchRecords from "@salesforce/apex/HierarchyController.searchRecords";

const DELAY = 300;

export default class HierarchySearch extends LightningElement {
	
	@api displayField;
	@api mode = null;
	@api parentRecordId = null;
	@api relationField = null;
	@api searchObject;
	
	blurTimeout;
	hasFocus = false;
	@track isExpanded = false;
	loading = false;
	searchKey = "";
	@track searchResults = [];

	get getDropdownClass() {
		let css = "slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click ";
		if (this.hasFocus && this.searchKey) {
			css += "slds-is-open";
		}
		return css;
	}

	get placeholderText() {
		return this.mode === "child" ? "Search child records here..." : "Search here...";
	}

	get resultsInit() {
		return this.searchResults.length == 0;
	}

	@wire(searchRecords, {
		searchKey: "$searchKey",
		searchObj: "$searchObject",
		displayField: "$displayField",
		searchMode: "$mode",
		parentRecordId: "$parentRecordId",
		relationField: "$relationField"
	})
	wiredSearchRecordDetails(result) {
		this.loading = false;
		this.wiredSearchRecords = result;
		const {data, error} = result;
		if (data) {
			this.searchResults = data.map((item) => {
				return { Id: item.Id, displayValue: item[this.displayField] };
			});
			if (this.searchResults.length > 0) {
				this.isExpanded = true;
			} else {
				this.isExpanded = false;
			}
		} else if (error) {
			this.searchResults = undefined;
		}
	}

	handleBlur() {
		// Delay hiding combobox so that we can capture selected result
		// eslint-disable-next-line @lwc/lwc/no-async-operation
		this.blurTimeout = window.setTimeout(() => {
			this.hasFocus = false;
			this.blurTimeout = null;
		}, 200);
	}

	handleComboboxClick() {
		// Hide combobox immediatly
		if (this.blurTimeout) {
			window.clearTimeout(this.blurTimeout);
		}
		this.hasFocus = false;
	}

	handleFocus() {
		this.hasFocus = true;
	}

	handleKeyChange(event) {
		if (!event.target.value) {
			this.isExpanded = true;
		}
		window.clearTimeout(this.delayTimeout);
		const searchKey = event.target.value;
		this.delayTimeout = setTimeout(() => {
			this.loading = true;
			this.searchKey = searchKey;
		}, DELAY);
	}

	handleResultClick(event) {
		const recordId = event.currentTarget.dataset.recordid;
		this.searchKey = event.currentTarget.dataset.displayvalue;
		this.searchResults = [{ Id: recordId, displayValue: this.searchKey }];
		const selectEvent = new CustomEvent("recordselect", { // Notify parent components that selection has changed.
			detail: recordId
		});
		this.dispatchEvent(selectEvent);
	}
}