// Confirm that the script is loaded at startup
// @ts-ignore
console.log("vierzeven-scripts.js loaded");

var vierzeven = {};

vierzeven.debug = true;
vierzeven.escratch = [false, false];
vierzeven.shiftEnabled = false;
vierzeven.pflA = false;
vierzeven.pflB = false;

// Sensitivity setting
vierzeven.UseAcceleration = true;
vierzeven.JogSensivity = 0.5;

// @ts-ignore
vierzeven.init = function (id) { // called when the device is opened & set up
    
    vierzeven.reset();

    // Ask BCD to send the current values of all rotary knobs and sliders
    // @ts-ignore
    midi.sendShortMsg(0xB0,0x64,0x7F);

    // Set jog acceleration
    if (vierzeven.UseAcceleration)
        // @ts-ignore
        midi.sendShortMsg(0xB0, 0x63, 0x7F);
    else
        // @ts-ignore
        midi.sendShortMsg(0xB0, 0x63, 0x0);
};

vierzeven.shutdown = function () {

    vierzeven.reset();

    // Reenable jog acceleration 
    if (!vierzeven.UseAcceleration)
        // @ts-ignore
        midi.sendShortMsg(0xB0, 0x63, 0x7F);
};

vierzeven.reset = function () {

    // Turn off all the lights
    for (let i = 0; i <= 25; i++) {
        // @ts-ignore
        midi.sendShortMsg(0xB0, i, 0);
    }

};

vierzeven.getDeck = function (group) {
    if (group == "[Channel1]")
        return 0;
    else if (group == "[Channel2]")
        return 1;
    
    // @ts-ignore
    console.log("Invalid group : " + group);
    return -1; // error
}


//Scratch, cue search and pitch bend function
// @ts-ignore
vierzeven.jogWheel = function (channel, control, value, status, group) {

    // @ts-ignore
    console.log("JOGGING... JOGGING...");

    // When SHIFT is pressed, the jogwheels are used to move through the library
    if (vierzeven.shiftEnabled) {
        if (value >= 65) {
            // @ts-ignore
            engine.setParameter("[Library]", "MoveDown", 0.5);
        } else {
            // @ts-ignore
            engine.setParameter("[Library]", "MoveUp", 0.5);
        }
    // When SHIFT is not pressed, the jogwheels are used for scratching/pitch bending
    } else {
        let deck = vierzeven.getDeck(group);
        if (vierzeven.escratch[deck]) {
            let scratchValue = (value - 0x40);
            // @ts-ignore
            engine.scratchTick(deck + 1, scratchValue);
            if (vierzeven.debug)
                // @ts-ignore
                console.log(group + " scratch tick : " + scratchValue);
        } else {
            let jogValue = (value - 0x40) * vierzeven.JogSensivity;
            // @ts-ignore
            engine.setValue(group, "jog", jogValue);
            if (vierzeven.debug)
                // @ts-ignore
                console.log(group + " pitching jog adjust : " + jogValue);
        }
    }
};

//Scratch button function 
// @ts-ignore
vierzeven.scratchButton = function (channel, control, value, status, group) {

    if (value != 0x7F)
        return;

    let deck = vierzeven.getDeck(group);

    vierzeven.escratch[deck] = !vierzeven.escratch[deck];

    if (vierzeven.debug)
        // @ts-ignore
        console.log(group + " scratch enabled :" + vierzeven.escratch[deck]);

    if (vierzeven.escratch[deck]) {
        // Turn on the scratch light
        if (!deck)
            // @ts-ignore
            midi.sendShortMsg(0xB0, 0x13, 0x7F);
        else
            // @ts-ignore
            midi.sendShortMsg(0xB0, 0x0B, 0x7F);

        // Enable scratching
        // @ts-ignore
        engine.scratchEnable(deck + 1, 100, 33+1/3, 1.0/8, (1.0/8)/32);

    } else {
        // Turn off the scratch light
        if (!deck)    
            // @ts-ignore
            midi.sendShortMsg(0xB0, 0x13, 0x00);
        else
            // @ts-ignore
            midi.sendShortMsg(0xB0, 0x0B, 0x00);

        // Disable scratching
        // @ts-ignore
        engine.scratchDisable(deck + 1);
    }
};

//Set loop function 
// @ts-ignore
vierzeven.loop = function (channel, control, value, status, group) {
    let action;
    if (value)
        action = "loop_in";
    else
        action = "loop_out";

    if (vierzeven.debug)
        // @ts-ignore
        console.log(group + " " + action);

     // @ts-ignore
     engine.setValue(group, action, 1);
};

/*------------------------------------------------------------------------------------
|
|   JOEY'S FUNCTIONS
|
--------------------------------------------------------------------------------------*/

// @ts-ignore
vierzeven.toggleShift = function(channel, control, value, status, group) {
    vierzeven.shiftEnabled = !vierzeven.shiftEnabled;
    // @ts-ignore
    console.log("Shift enabled = " + vierzeven.shiftEnabled);
}

// @ts-ignore
vierzeven.extInA = function(channel, control, value, status, group) {
    if (vierzeven.shiftEnabled) {
        // @ts-ignore
        engine.setParameter("[Channel1]", "loop_halve", 0.5);

    } else {
        // @ts-ignore
        engine.setParameter("[Channel2]", "loop_halve", 0.5);
    }
}

// @ts-ignore
vierzeven.cueA = function(channel, control, value, status, group) {
    if (value != 0) {
        if (vierzeven.shiftEnabled) {
            // @ts-ignore
            engine.setParameter("[Channel1]", "LoadSelectedTrack", 0.5);
        } else {
            if (vierzeven.pflA) {
                // @ts-ignore
                engine.setParameter("[Channel1]", "pfl", 0);
                vierzeven.pflA = false;
            } else {
                // @ts-ignore
                engine.setParameter("[Channel1]", "pfl", 1);
                vierzeven.pflA = true;
            }
        }
    }
}

// @ts-ignore
vierzeven.extInB = function(channel, control, value, status, group) {
    if (vierzeven.shiftEnabled) {
        // @ts-ignore
        engine.setParameter("[Channel1]", "loop_double", 0.5);
    } else {
        // @ts-ignore
        engine.setParameter("[Channel2]", "loop_double", 0.5);
    }
}

// @ts-ignore
vierzeven.cueB = function(channel, control, value, status, group) {
    if (value != 0) {
        if (vierzeven.shiftEnabled) {
            // @ts-ignore
            engine.setParameter("[Channel2]", "LoadSelectedTrack", 0.5);
        } else {
            if (vierzeven.pflB) {
                // @ts-ignore
                engine.setParameter("[Channel2]", "pfl", 0);
                vierzeven.pflB = false;
            } else {
                // @ts-ignore
                engine.setParameter("[Channel2]", "pfl", 1);
                vierzeven.pflB = true;
            }
        }
    }
}
