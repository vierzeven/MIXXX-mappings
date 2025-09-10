var mijnController = {};

mijnController.playToggle = function(channel, control, value, status, group) {
    if (value > 0) {
        engine.setValue(group, "play", !engine.getValue(group, "play"));
    }
};
