function beforeStateEntry(sequenceId) {
	var usuario = getValue("WKUser");

	if (usuario == 'alysson.silva1') {
		usuario = 'Alysson.Silva';
	}
	
	if (usuario == 'fernando.jarvorski') {
		usuario = 'fernando';
	}
}