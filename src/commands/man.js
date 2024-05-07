var fetch = require('node-fetch');


function man(env, args) {
  var command = args[0];

  // Function to fetch man page from the web
  async function fetchManPage(command) {
    var url = `https://raw.githubusercontent.com/Exeloz/bash-emulator/master/src/manual/${command}.txt`;
    try {
      var response = await fetch(url);
      if (response.ok) {
        const manPageText = await response.text();
        const lines = manPageText.split('\n');
    
        // Output each line individually using env.output
        lines.forEach(line => env.output(line + '\n'));
      } else {
        env.output(`No manual entry for ${command}`);
      }
    } catch (error) {
      env.output(`Error fetching man page: ${error.message}`);
    }
    env.exit();
  }

  // Try to fetch man page for the command
  fetchManPage(command);
}

module.exports = man;
