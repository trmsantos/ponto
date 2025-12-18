const fs = require('fs');
const path = require('path');

const filePath = path.resolve('node_modules/@inovua/reactdatagrid-enterprise/plugins/license/useLicense.js');
const lineNumber = 23; // The line number where you want to add or modify content

console.log("INOUA REACTDATAGRID license script executed");

fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the file:', err);
    process.exit(1);
  }

  // Split the file content into an array of lines
  const lines = data.split('\n');

  // Modify the specific line or add content to it
  if (!lines[lineNumber].includes('return true;')) {
    // Append the new line after line 24
    lines.splice(lineNumber, 0, 'return true;');
    // Join the modified lines back into a single string
    const modifiedContent = lines.join('\n');

    // Write the modified content back to the file
    fs.writeFile(filePath, modifiedContent, 'utf8', (err) => {
      if (err) {
        console.error('Error writing to the file:', err);
        process.exit(1);
      }

      console.log('File modification completed successfully.');
    });
  }
});