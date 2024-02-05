import { LightningElement, api } from "lwc";
import { NavigationMixin } from "lightning/navigation";

const classMap = {
  "show-label": "truncate-width-small",
  "no-width": "maxHeight"
};

export default class HierarchyField extends NavigationMixin(LightningElement) {

	@api deviceSize;
	@api fieldData;
	@api fieldMetadata;
	@api variant;

	get containerClass() {
		return this.variant === "show-label" ? this.deviceSize + " flexClass" : this.deviceSize;
	}

	get containsValue() {
		return typeof this.fieldData.value !== "undefined";
	}

	get isBoolean() {
		return this.fieldMetadata.type === "boolean";
	}

	get isCurrency() {
		let types = ["currency"];
		return types.indexOf(this.fieldMetadata.type) !== -1;
	}

	get isDate() {
		let types = ["date"];
		return types.indexOf(this.fieldMetadata.type) !== -1;
	}

	get isDateTime() {
		let types = ["datetime"];
		return types.indexOf(this.fieldMetadata.type) !== -1;
	}

	get isDouble() {
		let types = ["double", "int"];
		return types.indexOf(this.fieldMetadata.type) !== -1;
	}

	get isEmail() {
		return this.fieldMetadata.type === "email";
	}

	get isLocation() {
		return this.fieldMetadata.type === "location";
	}

	get isPercent() {
		let types = ["percent"];
		return types.indexOf(this.fieldMetadata.type) !== -1;
	}

	get isPhone() {
		return this.fieldMetadata.type === "phone";
	}

	get isReference() {
		return ( this.fieldMetadata.type === "reference" || this.fieldMetadata.nameField === true);
	}

	get isRichTextArea() {
		return this.fieldMetadata.htmlFormatted === true;
	}

	get isShowLabel() {
		return this.variant === "show-label";
	}

	get isString() {
		let types = ["id", "string", "picklist", "multipicklist"];
		return ( types.indexOf(this.fieldMetadata.type) !== -1 && this.fieldMetadata.nameField !== true && this.fieldMetadata.htmlFormatted !== true);
	}

	get isTime() {
		return this.fieldMetadata.type === "time";
	}

	get isURL() {
		return this.fieldMetadata.type === "url";
	}

	get valueClass() {
		let baseClass = "slds-truncate ";
		let widthClass = classMap[this.variant] || "truncate-width";
		return baseClass + widthClass;
	}

	navigateToRec(event) {
		//event.preventDefault();
		//alert("implement Record Nav");
		this[NavigationMixin.Navigate]({
			type: "standard__recordPage",
			attributes: {
				recordId: event.currentTarget.dataset.referenceid,
				actionName: "view"
			}
		});
		event.stopPropagation();
	}
}