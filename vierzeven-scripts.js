function vierzeven () {}

vierzeven.debug = false;
vierzeven.escratch = [false, false];

vierzeven.shiftEnabled = false;
vierzeven.pflA = false;
vierzeven.pflB = false;

//sensitivity setting
vierzeven.UseAcceleration = true;
vierzeven.JogSensivity = 0.5;




vierzeven.init = function (id) { // called when the device is opened & set up
    
    vierzeven.reset();

    // Ask BCD to send the current values of all rotary knobs and sliders
    midi.sendShortMsg(0xB0,0x64,0x7F);

    // Set jog acceleration
    if (vierzeven.UseAcceleration)
        midi.sendShortMsg(0xB0, 0x63, 0x7F);
    else
        midi.sendShortMsg(0xB0, 0x63, 0x0);
};

vierzeven.shutdown = function () {

    vierzeven.reset();

    // Reenable jog acceleration 
    if (!vierzeven.UseAcceleration)
        midi.sendShortMsg(0xB0, 0x63, 0x7F);
};

vierzeven.reset = function () {

    // Turn off all the lights
    for (i = 0; i <= 25; i++) {
        midi.sendShortMsg(0xB0, i, 0);
    }

};

vierzeven.getDeck = function (group) {
    if (group == "[Channel1]")
        return 0;
    else if (group == "[Channel2]")
        return 1;
    
    print("Invalid group : " + group);
    return -1; // error
}


//Scratch, cue search and pitch bend function
vierzeven.jogWheel = function (channel, control, value, status, group) {

    print("JOGGING... JOGGING...");

    if (vierzeven.shiftEnabled) {
        if (value >= 65) {
            engine.setParameter("[Library]", "MoveDown", 0.5);
        } else {
            engine.setParameter("[Library]", "MoveUp", 0.5);
        }
    } else {
        deck = vierzeven.getDeck(group);

        if (vierzeven.escratch[deck]) {
        
    
            scratchValue = (value - 0x40);
            engine.scratchTick(deck + 1, scratchValue);
    
            if (vierzeven.debug)
                print(group + " scratch tick : " + scratchValue);
    
        } else {
    
            jogValue = (value - 0x40) * vierzeven.JogSensivity;
            engine.setValue(group, "jog", jogValue);
    
            if (vierzeven.debug)
                print(group + " pitching jog adjust : " + jogValue);
    
        }
    
    }

};

//Scratch button function 
vierzeven.scratchButton = function (channel, control, value, status, group) {

    if (value != 0x7F)
        return;

    deck = vierzeven.getDeck(group);

    vierzeven.escratch[deck] = !vierzeven.escratch[deck];

    if (vierzeven.debug)
        print(group + " scratch enabled :" + vierzeven.escratch[deck]);

    if (vierzeven.escratch[deck]) {
        // Turn on the scratch light
        if (!deck)
            midi.sendShortMsg(0xB0, 0x13, 0x7F);
        else
            midi.sendShortMsg(0xB0, 0x0B, 0x7F);

        // Enable scratching
        engine.scratchEnable(deck + 1, 100, 33+1/3, 1.0/8, (1.0/8)/32);

    } else {
        // Turn off the scratch light
        if (!deck)    
            midi.sendShortMsg(0xB0, 0x13, 0x00);
        else
            midi.sendShortMsg(0xB0, 0x0B, 0x00);

        // Disable scratching
        engine.scratchDisable(deck + 1);
    }
};

//Set loop function 
vierzeven.loop = function (channel, control, value, status, group) {
    if (value)
        action = "loop_in";
    else
        action = "loop_out";

    if (vierzeven.debug)
        print(group + " " + action);

     engine.setValue(group, action, 1);
};

/*------------------------------------------------------------------------------------
|
|   JOEY'S FUNCTIONS
|
--------------------------------------------------------------------------------------*/

vierzeven.toggleShift = function(channel, control, value, status, group) {
    vierzeven.shiftEnabled = !vierzeven.shiftEnabled;
    print("Shift enabled = " + vierzeven.shiftEnabled);
}

vierzeven.extInA = function(channel, control, value, status, group) {
    if (vierzeven.shiftEnabled) {
        engine.setParameter("[Channel1]", "loop_halve", 0.5);

    } else {
        engine.setParameter("[Channel2]", "loop_halve", 0.5);
    }
}

vierzeven.cueA = function(channel, control, value, status, group) {
    if (value != 0) {
        if (vierzeven.shiftEnabled) {
            engine.setParameter("[Channel1]", "LoadSelectedTrack", 0.5);
        } else {
            if (vierzeven.pflA) {
                engine.setParameter("[Channel1]", "pfl", 0);
                vierzeven.pflA = false;
            } else {
                engine.setParameter("[Channel1]", "pfl", 1);
                vierzeven.pflA = true;
            }
        }
    }
}

vierzeven.extInB = function(channel, control, value, status, group) {
    if (vierzeven.shiftEnabled) {
        engine.setParameter("[Channel1]", "loop_double", 0.5);
    } else {
        engine.setParameter("[Channel2]", "loop_double", 0.5);
    }
}

vierzeven.cueB = function(channel, control, value, status, group) {
    if (value != 0) {
        if (vierzeven.shiftEnabled) {
            engine.setParameter("[Channel2]", "LoadSelectedTrack", 0.5);
        } else {
            if (vierzeven.pflB) {
                engine.setParameter("[Channel2]", "pfl", 0);
                vierzeven.pflB = false;
            } else {
                engine.setParameter("[Channel2]", "pfl", 1);
                vierzeven.pflB = true;
            }
        }
    }
}