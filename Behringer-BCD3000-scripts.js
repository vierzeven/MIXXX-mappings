function BehringerBCD3000 () {}

BehringerBCD3000.debug = false;
BehringerBCD3000.escratch = [false, false];

BehringerBCD3000.shiftEnabled = false;
BehringerBCD3000.pflA = false;
BehringerBCD3000.pflB = false;

//sensitivity setting
BehringerBCD3000.UseAcceleration = true;
BehringerBCD3000.JogSensivity = 0.5;




BehringerBCD3000.init = function (id) { // called when the device is opened & set up
    
    BehringerBCD3000.reset();

    // Ask BCD to send the current values of all rotary knobs and sliders
    midi.sendShortMsg(0xB0,0x64,0x7F);

    // Set jog acceleration
    if (BehringerBCD3000.UseAcceleration)
        midi.sendShortMsg(0xB0, 0x63, 0x7F);
    else
        midi.sendShortMsg(0xB0, 0x63, 0x0);
};

BehringerBCD3000.shutdown = function () {

    BehringerBCD3000.reset();

    // Reenable jog acceleration 
    if (!BehringerBCD3000.UseAcceleration)
        midi.sendShortMsg(0xB0, 0x63, 0x7F);
};

BehringerBCD3000.reset = function () {

    // Turn off all the lights
    for (i = 0; i <= 25; i++) {
        midi.sendShortMsg(0xB0, i, 0);
    }

};

BehringerBCD3000.getDeck = function (group) {
    if (group == "[Channel1]")
        return 0;
    else if (group == "[Channel2]")
        return 1;
    
    print("Invalid group : " + group);
    return -1; // error
}


//Scratch, cue search and pitch bend function
BehringerBCD3000.jogWheel = function (channel, control, value, status, group) {

    print("JOGGING... JOGGING...");

    if (BehringerBCD3000.shiftEnabled) {
        if (value >= 65) {
            engine.setParameter("[Library]", "MoveDown", 0.5);
        } else {
            engine.setParameter("[Library]", "MoveUp", 0.5);
        }
    } else {
        deck = BehringerBCD3000.getDeck(group);

        if (BehringerBCD3000.escratch[deck]) {
        
    
            scratchValue = (value - 0x40);
            engine.scratchTick(deck + 1, scratchValue);
    
            if (BehringerBCD3000.debug)
                print(group + " scratch tick : " + scratchValue);
    
        } else {
    
            jogValue = (value - 0x40) * BehringerBCD3000.JogSensivity;
            engine.setValue(group, "jog", jogValue);
    
            if (BehringerBCD3000.debug)
                print(group + " pitching jog adjust : " + jogValue);
    
        }
    
    }

};

//Scratch button function 
BehringerBCD3000.scratchButton = function (channel, control, value, status, group) {

    if (value != 0x7F)
        return;

    deck = BehringerBCD3000.getDeck(group);

    BehringerBCD3000.escratch[deck] = !BehringerBCD3000.escratch[deck];

    if (BehringerBCD3000.debug)
        print(group + " scratch enabled :" + BehringerBCD3000.escratch[deck]);

    if (BehringerBCD3000.escratch[deck]) {
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
BehringerBCD3000.loop = function (channel, control, value, status, group) {
    if (value)
        action = "loop_in";
    else
        action = "loop_out";

    if (BehringerBCD3000.debug)
        print(group + " " + action);

     engine.setValue(group, action, 1);
};

/*------------------------------------------------------------------------------------
|
|   JOEY'S FUNCTIONS
|
--------------------------------------------------------------------------------------*/

BehringerBCD3000.toggleShift = function(channel, control, value, status, group) {
    BehringerBCD3000.shiftEnabled = !BehringerBCD3000.shiftEnabled;
    print("Shift enabled = " + BehringerBCD3000.shiftEnabled);
}

BehringerBCD3000.extInA = function(channel, control, value, status, group) {
    if (BehringerBCD3000.shiftEnabled) {
        engine.setParameter("[Channel1]", "loop_halve", 0.5);

    } else {
        engine.setParameter("[Channel2]", "loop_halve", 0.5);
    }
}

BehringerBCD3000.cueA = function(channel, control, value, status, group) {
    if (value != 0) {
        if (BehringerBCD3000.shiftEnabled) {
            engine.setParameter("[Channel1]", "LoadSelectedTrack", 0.5);
        } else {
            if (BehringerBCD3000.pflA) {
                engine.setParameter("[Channel1]", "pfl", 0);
                BehringerBCD3000.pflA = false;
            } else {
                engine.setParameter("[Channel1]", "pfl", 1);
                BehringerBCD3000.pflA = true;
            }
        }
    }
}

BehringerBCD3000.extInB = function(channel, control, value, status, group) {
    if (BehringerBCD3000.shiftEnabled) {
        engine.setParameter("[Channel1]", "loop_double", 0.5);
    } else {
        engine.setParameter("[Channel2]", "loop_double", 0.5);
    }
}

BehringerBCD3000.cueB = function(channel, control, value, status, group) {
    if (value != 0) {
        if (BehringerBCD3000.shiftEnabled) {
            engine.setParameter("[Channel2]", "LoadSelectedTrack", 0.5);
        } else {
            if (BehringerBCD3000.pflB) {
                engine.setParameter("[Channel2]", "pfl", 0);
                BehringerBCD3000.pflB = false;
            } else {
                engine.setParameter("[Channel2]", "pfl", 1);
                BehringerBCD3000.pflB = true;
            }
        }
    }
}