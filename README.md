<h1>Salesforce Visual Record Hierarchy</h1>

<p>
  “Salesforce Visual Record Hierarchy” is derived from Leela Mohan's <a href="https://github.com/SalesforceLabs/AnyRecordHierarchy">“Any Record Hierarchy (ARH)”</a> product available through Salesforce Labs  on the Salesforce App Exchange. “Salesforce Visual Record Hierarchy” is a standalone product that only requires installation of the metadata in this repository to function. It does not require installation of ARH. However, since it is derived from ARH, to understand its base functionality, you can familiarize yourself with ARH’s base functionality. ARH demo videos and documentation can be found at:
</p>

<ul>
<li><b>ARH AppExchange Package:</b> https://appexchange.salesforce.com/appxListingDetail?listingId=a0N3A00000G12hNUAR</li>
<li><b>ARH Source Code:</b> https://github.com/SalesforceLabs/AnyRecordHierarchy</li>
<li><b>ARH Setup Guide:</b> https://salesforce.quip.com/US6zAozquu7g</li>
</ul>

<h2>Current Limitations of ARH <i>(as of Feb 2024)</i></h2>
<p>
  Technical Limitations:
</p>

<ul>
  <li>ARH is <i>limited to only being able to display a hierarchy of records for the same type of object the component is placed on via a self-lookup relationship on that object.</i> It cannot be placed on an object of one type, then display a hierarchy of another object type that is not the object it is displayed on. For example, if a user wants to create an account org chart for every Salesforce account, they cannot place the ARH component on an account, then reference the account’s contacts to actually be displayed in the component’s hierarchy.</li>
  <li>ARH <i>configuration records (which dictate which fields are shown in the hierarchy tiles and more) are stored in a front-end, non-deployable object,</i> as opposed to a back-end, deployable custom metadata type.</li>
  <li>Metadata that makes up ARH <i>does not have a consistent naming convention,</i> making it difficult to track on what contributes to the ARH product’s functionality.</li>
  <li>Although responsive, adaptive, and visually clean, <i>ARH can be limited in its visual display of a record hierarchy,</i> i.e. it cannot visually indicate which child records have further child records, visually cueing a user into which hierarchy tiles they can drill down further into.</li>
</ul>

<h2>Enhancements to ARH To Create "Salesforce Visual Record Hierarchy"</h2>
<p>
  Technical Enhancements:
</p>

<ul>
  <li>Ability to configure the hierarchy component to <i>either</i>:
    <ul>
      <li>be placed on an object but display the hierarchy of a <i>different</i> object.</li>
      <li>be placed on an object and display the hierarchy of the <i>same</i> object.</li>
    </ul>
  </li>
  <li>Migration of front-end, hierarchy configuration object to deployable, custom metadata type (CMT).</li>
  <li>Standardization of all hierarchy-related metadata names. All hierarchy-related metadata (apex classes, components, static resources, etc.) now begin with the prefix “hierarchy”.</li>
  <li>Ability to navigate down hierarchy tile, then click a button to reset back to the highest hierarchy tile.</li>
  <li>Ability to refresh the hierarchy component to pull most current data that feeds into the hierarchy.</li>
  <li>Ability for the hierarchy component to listen for a cross-component communication event and refresh itself when it receives an an event.</li>
</ul>

<p>
  Visual Enhancements:
</p>

<ul>
  <li>Ability to send in custom CSS to color hierarchy tiles based on attributes of each tile’s record.</li>
  <li>Ability to view how many total child records a hierarchy tile has to understand how to navigate the hierarchy better.</li>
  <li>Ability to display a combo of tile avatar image and a tile avatar field abbreviation within one hierarchy, as opposed to just one or the other.</li>
</ul>

<h1>“Salesforce Visual Record Hierarchy” Deployment and Configuration</h1>
<p>
  Deploy the following “Salesforce Visual Record Hierarchy” Metadata in the following order (listed in order of deployment to account for dependencies):
</p>

<ul>
  <li>Static Resources
    <ul>
      <li>Hierarchy_Resources</li>
    </ul>
  </li>
  <li>Lightning Message Channels
    <ul>
      <li>GeneralCommunications.messageChannel</li>
    </ul>
  </li>
  <li>Custom Metadata Types (CMT)
    <ul>
      <li>Hierarchy_Configuration__mdt</li>
    </ul>
  </li>
    <li>Custom Metadata Records
    <ul>
      <li>Hierarchy_Configuration.Account_Org_Chart_Hierarchy</li>
      <li>Hierarchy_Configuration.Contact_Hierarchy</li>
    </ul>
  </li>
  <li>Apex Classes
    <ul>
      <li>HierarchyConfigurationsPicklist</li>
      <li>HierarchyController</li>
    </ul>
  </li>
  <li>Lightning Web Components (LWC)
    <ul>
      <li>ldsUtils (used to help provide more user-friendly error handling)</li>
      <li>hierarchyField</li>
      <li>hierarchyAvatar</li>
      <li>hierarchySearch</li>
      <li>hierarchyErrorIllustration</li>
      <li>hierarchyTile</li>
      <li>hierarchyRecordContainerParent</li>
      <li>hierarchyRecordContainerChild</li>
      <li>hierarchyViewAllChildRecords</li>
      <li>hierarchyFullHierarchy</li>
      <li>hierarchyBase</li>
    </ul>
  </li>
</ul>

<p>
  Perform the following post-manual modifications in the destination environment in the following order (listed in order of deployment to account for dependencies):
</p>

<ul>
  <li>Enable access for all applicable profiles (profiles of users who need to view the hierarchy component) to the “Hierarchy_Configuration__mdt” custom metadata type (CMT) object.</li>
  <li>Enable access to all apex classes for all applicable profiles.</li>
  <li>Create a Hierarchy_Configuration__mdt custom metadata type (CMT) record to define a specific configuration for the "hierarchyBase" component when it is placed on an object’s lightning page.
    <ul>
      <li>Two example CMT records have been included to demonstrate the two possible configuration types: different component object than hierarchy object, same component object as hierarchy object.</li>
    </ul>
  </li>
  <li>Create additional hierarchy configuration fields (if applicable):
    <ul>
      <li>If the hierarchy component will be placed on an object that is <i>different</i> than the object that it will display a hierarchy for, create a new checkbox field on the object intended to be displayed in the hierarchy with the API name “Hierarchy_Start_Record__c” (the label does not matter).
        <ul>
          <li>Mark this box true on the hierarchy object record that will appear first (highest) in the record hierarchy.</li>
        </ul>
      </li>
      <li>If the hierarchy component should display customized CSS for each hierarchy tile that varies according to attributes (values) stored on the hierarchy object record, create a new formula text field on the object intended to be displayed in the hierarchy called “Hierarchy_Tile_Style__c”.
        <ul>
          <li>Example of a formula that could dictate the hierarchy tile CSS style is: CASE(Title__c, "CEO", "background-color: #b0d2b3;", "background-color: #fffff")</li>
        </ul>
      </li>
      <li>If the hierarchy component will display an image as the hierarchy tile avatar (or a "combo" of an image and an abbreviation), create a new URL field on the object intended to be displayed in the hierarchy called “Hierarchy_Avatar_Image_URL__c”.
        <ul>
          <li>An example of an image that could used as the hierarchy avatar image has been included in the static resources: https://<i>[SalesforceEnvironment]</i>.force.com/resource/1706193353000/Hierarchy_Resources/star.png </li>
        </ul>
      </li>
      <li>If the hierarchy component will display a total count of the subordinate records underneath a hierarchy tile, create a new number field on the object intended to be displayed in the hierarchy called “Hierarchy_Total_Subordinates__c” and populate it with the count of child records. To populate this count field automatically when a subordinate record is parented to another record, you could use a tool such as <a href="https://install.salesforce.org/products/dlrs/latest">Declarative Lookup Rollup Summaries (DLRS)</a>.</li>
    </ul>
  </li>
  <li>If you created any of the above additional hierarchy configuration fields on the object intended to be displayed in the hierarchy, revisit the Hierarchy_Configuration__mdt CMT record that was created earlier (or the example CMT records) and update the corresponding configuration fields to point to these new fields:
    <ul>
      <li>Subordinate Count Field = Hierarchy_Total_Subordinates__c</li>
      <li>Tile Style Field = Hierarchy_Tile_Style__c</li>
      <li>Visual Field = Hierarchy_Avatar_Image_URL__c</li>
    </ul>
  </li>
  <li>On a lightning record page (flexipage) for the "Component Object" listed on the CMT record, place the "hierarchyBase" component on the page and select the appropriate CMT record under the “Select Configuration” property of the component. The component should display appropriately according to the configuration specifications of the CMT record.</li>
</ul>

<h1>Examples of "Salesforce Visual Record Hierarchy"</h1>
<p>
  "HierarchyBase" component configured to display:
</p>
<ul>
  <li>on an object that is <i>different</i> than the hierarchy object.</li>
  <li>with customized CSS that color's a hierarchy tile based on the hierarchy tile contact's title.</li>
  <li>with a "combo" of abbreviations and images as the hierarchy tile avatars.</li>
  <li>with a total count of subordinate contacts that report to the hierarchy tile contact.</li>
</ul>
<p></p>

<img src="https://raw.githubusercontent.com/tee-oh/SalesforceVisualRecordHierarchy/main/images/ComponentObjDifferentThanHierarchyObj.JPG"/>

<p>
  "HierarchyBase" component configured to display:
</p>
<ul>
  <li>on an object that is the <i>same</i> as the hierarchy object.</li>
  <li>without any customized CSS (i.e. no background color) to style a hierarchy tile.</li>
  <li>with only abbreviations as the hierarchy tile avatars.</li>
  <li>without a total count of subordinate contacts that report to the hierarchy tile contact.</li>
</ul>
<p></p>

<img src="https://raw.githubusercontent.com/tee-oh/SalesforceVisualRecordHierarchy/main/images/ComponentObjSameAsHierarchyObj.JPG"/>















