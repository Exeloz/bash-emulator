async function run(cmd) {
  logOutput("$ " + cmd);

  try {
    const result = await emulator.run(cmd);
    logOutput(result + "\n");
    keepScrolledDownForInput();
    updateInputPrefix();
  } catch (error) {
    logError('<div class="error">' + error + "</div>");
  }
}

function logError(result) {
  logOutput(result);
}

function logOutput(result) {
  if (result) {
    output.innerHTML += result + "\n";
    keepScrolledDownForInput();
  }
}

function keepScrolledDownForInput() {
  const scrollHeight = document.body.scrollHeight;
  window.scrollTo(0, scrollHeight);
}

async function updateInputPrefix() {
  const path = await emulator.getDir();
  const user = await emulator.getUser();
  input_prefix.innerHTML =
    `<span style="color: lime;">${user}</span>` +
    `<span style="color: white;">:</span>` +
    `<span style="color: DodgerBlue;">${path}</span>` +
    `<span style="color: white;">$</span>`;
  const inputPrefix = document.getElementById("input_prefix");
  const prefixWidth = inputPrefix.offsetWidth;
  document.documentElement.style.setProperty(
    "--prefix-width",
    `${prefixWidth}px`
  );
}

module.exports = run;
