import { LightningElement, api } from "lwc";

export default class HierarchyErrorIllustration extends LightningElement {

	@api errorData; 

	get illustrationClass() {
		let classStr = "slds-illustration slds-illustration_";
		return this.errorData.name == "Howdy! Fancy a hierarchy?" ? classStr + "large" : classStr + "small";
	}

	get illustrationType() { // Return string error based on error code received.
		return {
			noconfig: this.errorData.code == 100,
			newconfig: this.errorData.code == 200,
			configexcption: this.errorData.code == 400 || this.errorData.code == 404,
			noaccess: this.errorData.code == 403,
		};
	}
}