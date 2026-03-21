function getDigressionPrompt(message) {
  return `You are monitoring an in-person telecom store service interaction.
The store executive said: "${message}"
Is this message relevant to handling a walk-in SIM replacement request at a telecom store?
Reply with ONLY the word YES or NO. Nothing else.`;
}

module.exports = { getDigressionPrompt };
