#!/bin/bash

HOMEBRIDGE_BINARY="homebridge"
HOMEBRIDGE_SERVER_DIR="../"
HOMEBRIDGE_CONFIG="homebridge-test-config.json"

# You can set variables to own values by the command line when calling 'npm test':
# - 'HBB': Provide the full path to the 'homebridge' binary; otherwise make sure, that  'homebridge' is found by the shell.
# - 'HBS': Full path to the homebridge-server directory used for development.
# - 'HBC': If you have a special config file for homebridge, provide the fullt path (e.g. for local testing).
# Example:
# $ HBB="/Development/homebridge/bin/homebridge" HBS="/Development/homebridge-server/" HBC="local_conf.json" npm test
if [ $HBB ]; then
    HOMEBRIDGE_BINARY=$HBB
fi

if [ $HBS ]; then
    HOMEBRIDGE_SERVER_DIR=$HBS
fi

if [ $HBC ]; then
    HOMEBRIDGE_CONFIG=$HBC
fi


echo "Starting homebridge with test config..."
# Stop running homebridge instances
if pgrep homebridge; then
    echo "Killing other homebridge instance."
    killall homebridge
fi

TEST_CONFIG_DIR="/tmp/homebridge-server-test"

# Create config directory if not exists
if ! [ -x "$TEST_CONFIG_DIR/" ]; then
    mkdir "$TEST_CONFIG_DIR/"
fi

# Copy the config.json fixture
cp scripts/$HOMEBRIDGE_CONFIG "$TEST_CONFIG_DIR/config.json"

# Start homebridge
$HOMEBRIDGE_BINARY -U $TEST_CONFIG_DIR -P $HOMEBRIDGE_SERVER_DIR >/dev/null 2>&1 &

# Give homebridge 5 seconds to be ready
echo "Waiting 5 seconds for homebridge to start..."
sleep 5

# Tests
echo "Testing:"
echo "========"

## original test:
## homebridge -U ~/.homebridge -P . > /dev/null 2>&1 & sleep 10; ( curl -Is http://127.0.0.1:8765/remove | head -1 ); kill $!

echo "1) Lint"
eslint ./*.js api/*.js content/*.js
EXIT1=$?

echo "2) mocha"
./node_modules/mocha/bin/mocha
EXIT2=$?



# Clean up
# Stop the homebridge instance
killall homebridge
rm -rf $TEST_CONFIG_DIR

# Add up the exit codes and return
EXITCODE=$(expr $EXIT1 + $EXIT2)
exit $EXITCODE
