import { LightningElement, api } from "lwc";
import defaultTemplate from "./hierarchyTile.html";
import listTileTemplate from "./hierarchyTileList.html";
import headerTemplate from "./hierarchyTileHeader.html";

const templateMap = {
	list: listTileTemplate,
	header: headerTemplate
};

export default class HierarchyTile extends LightningElement {
	
	@api deviceSize;
	@api isMoreItems;
	@api metadata;
	@api mode;
	@api record;
	@api refObjNameFields;
	@api visualType;

	showPopover = false;

	get fieldData() {
		let formattedData = Object.keys(this.metadata).reduce((data, item) => {
			let dataValues = {value: this.record[this.metadata[item].name]};
			if (dataValues.value) {
				if (this.metadata[item].type === "reference") {
					let relationName = this.metadata[item].relationshipName;
					dataValues.referenceValue = this.record[relationName][this.refObjNameFields[relationName]];
				}
				if (this.metadata[item].nameField === true && item !== "Abbreviation_Field__c" & item !== "Visual_Field__c") {
					dataValues.value = this.record.Id;
					dataValues.referenceValue = this.record[this.metadata[item].name];
				}
				if (this.metadata[item].type === "datetime") {
					dataValues.value = Date.parse(dataValues.value);
				}
				if (this.metadata[item].type === "time") {
					dataValues.value = Date.parse("02 Jan 1970 " + dataValues.value + " GMT");
				}
				if (this.metadata[item].type === "percent") {
					dataValues.value = dataValues.value / 100;
				}
			}
			data[item] = dataValues;
			return data;
		}, {});
		
		// Assign hierarchy tile style, if any.
		if (formattedData.Tile_Style_Field__c != null) {
			formattedData.tileStyleValue = formattedData.Tile_Style_Field__c.value;
		} else {
			formattedData.tileStyleValue = '';
		}

		// Assign subordinate count field, if any.
		if (formattedData.Subordinate_Count_Field__c != null) {
			formattedData.subOrdinateCount = formattedData.Subordinate_Count_Field__c.value;
			if (formattedData.subOrdinateCount > 0) {
				formattedData.showSubordinateCount = true;
			} else {
				formattedData.showSubordinateCount = false;
			}
		} else {
			formattedData.showSubordinateCount = false;
			formattedData.subOrdinateCount = '';
		}

		// Assign avatar image, if any.
		if (this.visualType == "Abbreviation") {
			const textToAbbr = formattedData.Abbreviation_Field__c.value;
			if (textToAbbr) {
				let words = textToAbbr.split(" ");
				let abbr;
				if (words.length > 1) {
					abbr = words[0].charAt(0) + words[words.length - 1].charAt(0);
				} else {
					abbr = words[0].slice(0, 2);
				}
				formattedData.avatarValue = abbr.toUpperCase();
			}
		} else if (this.visualType == 'Combo') {
			if (formattedData.Visual_Field__c.value == null) {
				const textToAbbr = formattedData.Abbreviation_Field__c.value;
				if (textToAbbr) {
					let words = textToAbbr.split(" ");
					let abbr;
					if (words.length > 1) {
						abbr = words[0].charAt(0) + words[words.length - 1].charAt(0);
					} else {
						abbr = words[0].slice(0, 2);
					}
					formattedData.avatarValue = abbr.toUpperCase();
				}
			} else {
				formattedData.avatarValue = formattedData.Visual_Field__c.value;
			}
		} else if (this.visualType == 'Image') {
			formattedData.avatarValue = formattedData.Visual_Field__c.value;
		}
		return formattedData;
	}

	get isCurrentRecord() {
		return this.deviceSize === "MEDIUM current-record" ? true : false;
	}

	get visual() {
		return {Abbreviation: this.visualType == "Abbreviation", Combo: this.visualType == "Combo", Image: this.visualType == "Image"};
	}

	fireMoreEvent() {
		const showallEvent = new CustomEvent("showall", { detail: this.record.Id });
		this.dispatchEvent(showallEvent);
	}

	hidePopOver() {
		this.showPopover = false;
	}

	render() {
		return templateMap.hasOwnProperty(this.mode) ? templateMap[this.mode] : defaultTemplate;
	}

	selectRecord() {
		const searchEvent = new CustomEvent("recordclick", {
			detail: this.record.Id
		});
		this.dispatchEvent(searchEvent);
	}

	showPopOver() {
		if (this.deviceSize !== "SMALL") {
			this.showPopover = true;
		}
	}
}