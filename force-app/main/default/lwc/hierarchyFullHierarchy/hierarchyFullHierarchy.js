import { LightningElement, api } from "lwc";

export default class HierarchyFullHierarchy extends LightningElement {
	
	@api configInfo;
	@api deviceSize;
	@api parentRecords;
	@api refObjNameFields;
	@api visualType;

	transformObj;

	handleRecordClick(event) {
		const recordId = event.detail;
		const search = new CustomEvent("recordselect", {
			detail: recordId
		});
		this.dispatchEvent(search);
	}

	get dynamicRoot() {
		if (this.parentRecords) {
			this.transformObj = JSON.parse(JSON.stringify(this.parentRecords)).reverse();
			return this.transformObj && this.transformObj[0].hasOwnProperty("ParentId") ? true : false;
		}
	}

	get parentHierarchy() {
		if (this.parentRecords) {
			const transform = JSON.parse(JSON.stringify(this.parentRecords));
			return transform.reverse();
		}
	}

	goToHome() {
		const home = new CustomEvent("backhome", {
			detail: this.parentRecords[0].Id
		});
		this.dispatchEvent(home);
	}

	refreshParent() {
		this.transformObj = JSON.parse(JSON.stringify(this.parentRecords)).reverse();
		if (this.transformObj[0].hasOwnProperty("ParentId")) {
			const search = new CustomEvent("showhierarchy", {
				detail: {
				Id: this.transformObj[0].ParentId,
				Source: "fullHierarchyComponent"
				}
			});
			this.dispatchEvent(search);
		}
	}
}