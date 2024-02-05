public with sharing class HierarchyController {
	
	@AuraEnabled (cacheable=true)
	public static String getCMTConfig(Id cmtConfigRecordId) {
		try {
			// Get cmt hierarcy configuration record.
			Hierarchy_Configuration__mdt configRecord;
			String fieldNames = 'Abbreviation_Field__c, Component_Object__c,Detail_Field_1__c,Detail_Field_2__c,Detail_Field_3__c,Detail_Field_4__c,Detail_Field_5__c,Detail_Field_6__c,';
			fieldNames =+ 'Hierarchy_Location__c,Hierarchy_Object__c,Label,Record_Matching_Field__c,Relationship_Field__c,Search_Field__c,Subordinate_Count_Field__c,Tile_Style_Field__c,Visual_Field__c,Visual_Type__c';
			if (isAccessibleFLS(fieldNames.split(','), 'Hierarchy_Configuration__mdt')) {
				configRecord = [SELECT Id, Abbreviation_Field__c, Component_Object__c, Detail_Field_1__c, Detail_Field_2__c, Detail_Field_3__c, Detail_Field_4__c, Detail_Field_5__c, Detail_Field_6__c,
									Hierarchy_Location__c, Hierarchy_Object__c, Label, Record_Matching_Field__c, Relationship_Field__c, Search_Field__c, Subordinate_Count_Field__c, Tile_Style_Field__c, Visual_Field__c, Visual_Type__c
									FROM Hierarchy_Configuration__mdt
									WHERE Id = :cmtConfigRecordId];
			} else {
				String errorMessage = 'You do not have access to the Hierarchy Configuration object. Please contact your administrator to make sure you have access to the Hierarchy Configuration object.';
				AuraHandledException ex = new AuraHandledException(errorMessage);
				ex.setMessage(errorMessage);
				throw ex;
			}
			// Collect fields for display in the hierarchy tiles that will need access checked from the configuration record.
			Map<String, String> hierarchyObjFieldsToDescribe = new Map<String, String>();
			hierarchyObjFieldsToDescribe.put('Abbreviation_Field__c', configRecord.Abbreviation_Field__c);
			hierarchyObjFieldsToDescribe.put('Detail_Field_1__c', configRecord.Detail_Field_1__c);
			hierarchyObjFieldsToDescribe.put('Detail_Field_2__c', configRecord.Detail_Field_2__c);
			hierarchyObjFieldsToDescribe.put('Detail_Field_3__c', configRecord.Detail_Field_3__c);
			hierarchyObjFieldsToDescribe.put('Detail_Field_4__c', configRecord.Detail_Field_4__c);
			hierarchyObjFieldsToDescribe.put('Detail_Field_5__c', configRecord.Detail_Field_5__c);
			hierarchyObjFieldsToDescribe.put('Detail_Field_6__c', configRecord.Detail_Field_6__c);
			hierarchyObjFieldsToDescribe.put('Subordinate_Count_Field__c', configRecord.Subordinate_Count_Field__c);
			hierarchyObjFieldsToDescribe.put('Tile_Style_Field__c', configRecord.Tile_Style_Field__c);
			hierarchyObjFieldsToDescribe.put('Visual_Field__c', configRecord.Visual_Field__c);
			// Get the hierarchy object and fields.
			Map<String, Schema.SObjectType> globalDescribe = Schema.getGlobalDescribe();
			DescribeSObjectResult hierarchyObject = globalDescribe.get(configRecord.Hierarchy_Object__c).getDescribe();
			Map<String, Schema.SObjectField> hierarchyObjectFields = hierarchyObject.fields.getMap();
			// Check for hierarchy object and hierarchy fields access.
			List<String> fieldNamesToCheckAccess = hierarchyObjFieldsToDescribe.values();
			fieldNamesToCheckAccess.add(configRecord.Search_Field__c);
			fieldNamesToCheckAccess.add(configRecord.Relationship_Field__c);
			if (!isAccessible(fieldNamesToCheckAccess, hierarchyObject, hierarchyObjectFields)) {
				CustomExceptionData cExpData = new CustomExceptionData('Insufficient Privileges', 'You do not have access to either the fields or the object. Please contact your administrator.', 403);
				AuraHandledException ex = new AuraHandledException(JSON.serialize(cExpData));
				ex.setMessage(JSON.serialize(cExpData));
				throw ex;
			}
			Schema.DescribeFieldResult relationField = hierarchyObjectFields.get(configRecord.Relationship_Field__c).getDescribe();
			// Collect hierarchy object fields to query later.
			Set<String> hierarchyObjFieldsToQuery = new Set<String>();
			hierarchyObjFieldsToQuery.add(configRecord.Relationship_Field__c);
			// Collect hierarchy object field results and any referene object fields.
			Map<String, Schema.DescribeFieldResult> objectFields = new Map<String, Schema.DescribeFieldResult>();
			Map<String, String> refObjNameFields = new Map<String, String>();
			for (String configRecordField : hierarchyObjFieldsToDescribe.keySet()) { // For every config record field to display in the hierarchy tile...
				String hierObjFieldAPIName = hierarchyObjFieldsToDescribe.get(configRecordField); // ...get the API name of the hierarchy object field to display.
				if (!String.isBlank(hierObjFieldAPIName)) {
				Schema.DescribeFieldResult hierObjFieldResult = hierarchyObjectFields.get(hierObjFieldAPIName).getDescribe(); // Use API name to get the entire hierarchy field metadata (describe).
				objectFields.put(configRecordField, hierObjFieldResult); // Store config record field to hierarchy field metadata.
				hierarchyObjFieldsToQuery.add(hierObjFieldResult.getName()); // Add hierarchy field to set to build query string. 
					if (String.valueOf(hierObjFieldResult.getType()) == 'Reference') { // If hierarchy field result is lookup, i.e. AccountId...
						String relObjfieldName; // ...get related record Name value.
						if (hierObjFieldResult.isNamePointing()) {
							relObjfieldName = 'Name';
						} else {
							relObjfieldName = getNameField(hierObjFieldResult.getReferenceTo()[0].getDescribe());
						}
						if (relObjfieldName == 'No Name Field') {
							CustomExceptionData cExpData = new CustomExceptionData('Insufficient Privileges', 'You do not have access to either the fields or the object. Please contact your administrator.', 403);
							AuraHandledException ex = new AuraHandledException(JSON.serialize(cExpData));
							ex.setMessage(JSON.serialize(cExpData));
							throw ex;
						}
						hierarchyObjFieldsToQuery.add(hierObjFieldResult.getRelationshipName() + '.' + relObjfieldName); // Add related record name field to set to build query.
						refObjNameFields.put(hierObjFieldResult.getRelationshipName(), relObjfieldName); // Store related record relationship and name field.
					}
				}
			}
			if (!hierarchyObjFieldsToQuery.contains('Id')) { // Add Id to set of fields to query from hierarchy object.
				hierarchyObjFieldsToQuery.add('Id');
			}
			// Build query string to retrieve values from the hierarchy object.
			String queryString = 'SELECT ' + String.join((Iterable<String>) hierarchyObjFieldsToQuery, ', ').removeEnd(', ') + ' FROM ' + configRecord.Hierarchy_Object__c;
			// Build data to return to hierarchy component.
			Map<String, String> cData = new Map<String, String>();
			cData.put('hierarchyLocation', configRecord.Hierarchy_Location__c);
			cData.put('hierarchyObject', configRecord.Hierarchy_Object__c);
			cData.put('metadata', JSON.serialize(objectFields));
			cData.put('queryString', queryString);
			cData.put('recordMatchingField', configRecord.Record_Matching_Field__c);
			cData.put('relationField', configRecord.Relationship_Field__c);
			cData.put('refObjNameFields', JSON.serialize(refObjNameFields));
			cData.put('searchField', configRecord.Search_Field__c);
			cData.put('visualType', configRecord.Visual_Type__c);
			return JSON.serialize(cData);
		} catch (Exception e) {
			String errorMessage;
			String errorType = e.getTypeName();
			if (errorType == 'System.AuraHandledException') {
				errorMessage = e.getMessage();
			} else if (errorType == 'System.QueryException' && e.getMessage() == 'List has no rows for assignment to SObject') {
				CustomExceptionData cExpData = new CustomExceptionData('Uh Oh! Hierarchy Configuration not found.', 'We couldn\'t find selected Hierarchy Configuration. Please contact your administrator.', 404);
				errorMessage = JSON.serialize(cExpData);
			} else {
				CustomExceptionData cExpData = new CustomExceptionData('Uh Oh! An Error Occurred.', e.getMessage(), 400);
				errorMessage = JSON.serialize(cExpData);
			}
			AuraHandledException ex = new AuraHandledException(errorMessage);
			ex.setMessage(errorMessage);
			throw ex;
		}
	}

	public static String getNameField(DescribeSObjectResult dsores) {
		String fName = 'No Name Field';
		if (dsores.isAccessible()) {
			Map<String, SObjectField> fields = dsores.fields.getMap();
			for (sObjectField s : fields.values()) {
				Schema.DescribeFieldResult t = s.getDescribe();
				if (t.isNameField()) {
					if (t.isAccessible()) {
						fName = t.getName();
					}
					break;
				}
			}
		}
		return fName;
	}

	@AuraEnabled (cacheable=true)
	public static List<sObject> getHierarchyStartRecord(String startRecordQueryString) {
		return Security.stripInaccessible(AccessType.READABLE, Database.query(startRecordQueryString)).getRecords();
	}

	@AuraEnabled
	public static List<sObject> getPeerRecords(String queryString, String relationField, Id parentRecordId, Id currentRecId) {
		try {
			if (String.isEmpty(parentRecordId)) {
				return new List<sObject>();
			}
			String peerQuery = queryString + ' WHERE ' + relationField + ' = \'' + parentRecordId +'\' AND Id != \'' + currentRecId + '\'';
			System.debug(peerQuery);
			return Security.stripInaccessible(AccessType.READABLE, Database.query(peerQuery)).getRecords();
		} catch (exception e) {
			AuraHandledException excp = new AuraHandledException(e.getMessage());
			excp.setMessage(e.getMessage());
			throw excp;
		}
	}

	@AuraEnabled (cacheable=true)
	public static String getHierarchyRecords(String queryString, String relationField, Id currentRecId) {
		System.debug('in get hierarchy records apex: ' + currentRecId);
		queryString = String.escapeSingleQuotes(queryString);
		relationField = String.escapeSingleQuotes(relationField);
		try {
			if (String.isBlank(queryString) || String.isBlank(relationField) || currentRecId == null) {
				AuraHandledException excp = new AuraHandledException('Invalid Parameters');
				excp.setMessage('Invalid Parameters');
				throw excp;
			}
			Map<String, sObject[]> recData = new Map<String, sObject[]>();
			String currentRecordQuery = queryString + ' WHERE Id = \'' + currentRecId + '\'';
			sObject[] currentRecord = Security.stripInaccessible(AccessType.READABLE, Database.query(currentRecordQuery)).getRecords();
			recData.put('currentRecord', currentRecord);
			Id currentParentRecordId = (Id)currentRecord[0].get(relationField);
			if (currentParentRecordId != null) {
				recData.put('parentRecords', getSObjectHierarchy(queryString, relationField, String.ValueOf(currentParentRecordId), new List<sObject>()));
			}
			String childQuery = queryString + ' WHERE ' + relationField + ' = \'' + currentRecId + '\'';
			recData.put('childRecords', Security.stripInaccessible(AccessType.READABLE, Database.query(childQuery)).getRecords());
			//System.debug(recData);
			return JSON.serialize(recData);
		} catch (exception e) {
			AuraHandledException excp = new AuraHandledException(e.getMessage());
			excp.setMessage(e.getMessage());
			throw excp;
		}
	}

	@AuraEnabled
	public static List<sObject> getSObjectHierarchy(String queryString, String relationField, String recordId, List<sObject> recordList) {
		try {
			queryString = String.escapeSingleQuotes(queryString);
			recordId = String.escapeSingleQuotes(recordId);
			relationField = String.escapeSingleQuotes(relationField);
			// System.debug(recordList);
			if (recordList == null) {
				recordList = new List<sObject>();
			}
			String recQueryStr = queryString + ' WHERE Id = \'' + recordId + '\'';
			sObject rec = Security.stripInaccessible(AccessType.READABLE, Database.query(recQueryStr)).getRecords()[0];
			recordList.add(rec);
			if (rec.get(relationField) != null) {
				if (Limits.getQueries() <= Limits.getLimitQueries() && recordList.size() <= 3) {
					getSObjectHierarchy(queryString, relationField, String.ValueOf(rec.get(relationField)), recordList);
				}
			}
			return recordList;
		} catch (exception e) {
			AuraHandledException excp = new AuraHandledException(e.getMessage());
			excp.setMessage(e.getMessage());
			throw excp;
		}
	}
	
	public static boolean isAccessible(List<String> fieldNames, DescribeSObjectResult hierarchyObject, Map<String, Schema.SObjectField> hierarchyObjectFields) {
		boolean isSafe = false;
		if (hierarchyObject.isAccessible()) {
			for (String fldName : fieldNames) {
				if (!String.isBlank(fldName)) {
					SObjectField myField = hierarchyObjectFields.get(fldName);
					if (myField.getDescribe().isAccessible()) {
						isSafe = true;
					} else {
						isSafe = false;
						break;
					}
				}
			}
		} else {
			isSafe = false;
		}
		return isSafe;
	}

	public static boolean isAccessibleFLS(List<String> fieldNames, String objName) {
		boolean isSafe = false;
		Map<String, Schema.SObjectType> schemaMap = Schema.getGlobalDescribe();
		DescribeSObjectResult myObj = schemaMap.get(objName).getDescribe();
		if(myObj.isAccessible()) { 
			Map<String, Schema.SObjectField> myObjFields = myObj.fields.getMap();
			for(String fldName: fieldNames) {
				SObjectField myField = myObjFields.get(fldName);
				if (myField != null && myField.getDescribe().isAccessible()) {
					isSafe = true;
				} else {
					isSafe = false;
					break;
				}    
			}
		} else {
			isSafe = false;
		}
		return isSafe;
	}

	public static boolean isCreatable(List<String> fieldNames, DescribeSObjectResult hierarchyObject, Map<String, Schema.SObjectField> hierarchyObjectFields) {
		boolean isSafe = false;
		if (hierarchyObject.isCreateable()) {
			for (String fldName : fieldNames) {
				if (!String.isBlank(fldName)) {
					SObjectField myField = hierarchyObjectFields.get(fldName);
					if (myField.getDescribe().isCreateable()) {
						isSafe = true;
					} else {
						isSafe = false;
						break;
					}
				}
			}
		} else {
			isSafe = false;
		}
		return isSafe;
  	}
	
	public static boolean isDeletable(DescribeSObjectResult hierarchyObject) {
		boolean isSafe = false;
		if (hierarchyObject.isDeletable()) {
			isSafe = true;
		}
		return isSafe;
	}
	
	public static boolean isUpdateable(List<String> fieldNames, String objName) {
		boolean isSafe = false;
		Map<String, Schema.SObjectType> schemaMap = Schema.getGlobalDescribe();
		DescribeSObjectResult myObj = schemaMap.get(objName).getDescribe();
		if (myObj.isUpdateable()) { 
			Map<String, Schema.SObjectField> myObjFields = myObj.fields.getMap();
			for (String fldName: fieldNames) {
				SObjectField myField = myObjFields.get(fldName);
				if (myField != null && myField.getDescribe().isUpdateable()) {
					isSafe = true;
				} else {
					isSafe = false;
					break;
				}    
			}
		} else {
			isSafe = false;
		}
		return isSafe;
	}

	@AuraEnabled(cacheable=true)
	public static Object searchRecords(String searchKey, String searchObj, String displayField, String searchMode, String parentRecordId, String relationField) {
		searchKey = String.escapeSingleQuotes(searchKey);
		searchObj = String.escapeSingleQuotes(searchObj);
		displayField = String.escapeSingleQuotes(displayField);
		try {
			if (!String.isBlank(searchKey) && !String.isBlank(searchObj) && !String.isBlank(displayField)) {
				String key = '%' + searchKey + '%';
				String soqlStr = 'select Id, ' + displayField + ' from ' + searchObj;
				soqlStr += ' WHERE ' + displayField + ' LIKE \'' + key + '\'';
				if (searchMode == 'child') {
					soqlStr += ' AND ' + relationField + ' = \'' + parentRecordId + '\'';
				}
				soqlStr += ' WITH SECURITY_ENFORCED ORDER BY ' +
				displayField + ' DESC LIMIT 8';
				List<sObject> sObjResults = Database.query(soqlStr);
				return sObjResults;
			} else {
				return new List<sObject>();
			}
		} catch (exception e) {
			AuraHandledException excp = new AuraHandledException(e.getMessage());
			excp.setMessage(e.getMessage());
			throw excp;
		}
	}

	public class CustomExceptionData {
		public String name;
		public String message;
		public Integer code;
		
		public CustomExceptionData(String name, String message, Integer code) {
			this.name = name;
			this.message = message;
			this.code = code;
		}
	}
}