const fs = require('fs');
const path = require('path');

//const filePath = path.resolve('node_modules/ag-grid-enterprise/dist/ag-grid-enterprise.auto.esm.js');
const filePath = path.resolve('node_modules/ag-grid-enterprise/dist/package/main.esm.mjs');
const searchStrings = [
  `static extractExpiry(license) {`,
  `static extractLicenseComponents(licenseKey) {`,
]; // Strings to search
const addLines = [
  `
        /*ADDED*/
        const currentDate = new Date();
        const nextYear = new Date(currentDate);
        nextYear.setFullYear(currentDate.getFullYear() + 1);
        return nextYear;
        /**/
  `,
  `
        /*ADDED*/
        return {md5:"3c6e0b8a9c15224a8228b9a98ca1531d",license:"key",version:"3",isTrial:false,type:"BOTH"};
        /**/
  `
]; // rows to add

console.log("AG-GRID license script executed");
try{
  let content = fs.readFileSync(filePath, 'utf-8');
  const exists = content.indexOf("/*ADDED*/");
  if (exists == -1){
    // Find the positions of search strings
    const indexes = searchStrings.map((searchString) => content.indexOf(searchString));
    // Insert lines after each occurrence
    for (let i = indexes.length - 1; i >= 0; i--) {
      const insertIndex = indexes[i] + searchStrings[i].length;
      content = content.slice(0, insertIndex) + '\n' + addLines[i] + '\n' + content.slice(insertIndex);
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('File modification completed successfully.');
}
} catch (error) {
  console.error('Error writing to the file:', error.message);
}


