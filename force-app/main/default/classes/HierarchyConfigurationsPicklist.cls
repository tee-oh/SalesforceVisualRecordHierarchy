global with sharing class HierarchyConfigurationsPicklist extends VisualEditor.DynamicPickList {

	public List<Hierarchy_Configuration__mdt> allHierarchyConfigs;
	VisualEditor.DesignTimePageContext context;
	String naMessage = 'None Available';

	global HierarchyConfigurationsPicklist(VisualEditor.DesignTimePageContext context) {
		String queryStr = 'SELECT Id, Label FROM Hierarchy_Configuration__mdt';
		if (context.pageType == 'RecordPage') {
			queryStr += ' WHERE Component_Object__c = \'' + context.entityName + '\'';
			naMessage += ' for this Object';
		}
		this.allHierarchyConfigs = Database.query(queryStr);
		this.context = context;
	}
  
	global override VisualEditor.DataRow getDefaultValue() {
		VisualEditor.DataRow defaultValue;
		if (allHierarchyConfigs.size() > 0) {
			defaultValue = new VisualEditor.DataRow(
				(String) allHierarchyConfigs[0].get('Name'),
				(String) allHierarchyConfigs[0].get('Id')
			);
		} else {
			defaultValue = new VisualEditor.DataRow(naMessage, 'None');
		}
		return defaultValue;
	}

	global override VisualEditor.DynamicPickListRows getValues() {
	  VisualEditor.DynamicPickListRows myValues = new VisualEditor.DynamicPickListRows();
		if (allHierarchyConfigs.size() > 0) {
			for (Hierarchy_Configuration__mdt config : allHierarchyConfigs) {
				myValues.addRow(
					new VisualEditor.DataRow(
						String.valueOf(config.Label),
						String.valueOf(config.Id)
					)
				);
			}
		} else {
			myValues.addRow(new VisualEditor.DataRow(naMessage, 'None'));
		}
		return myValues;
	}
}