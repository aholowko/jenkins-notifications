/*
  Grays out or [whatever the opposite of graying out is called] the option
  field.
*/
function ghost(isDeactivated) {
    options.style.color = isDeactivated ? 'graytext' : 'black'; // The label color.
    options.frequency.disabled = isDeactivated;                 // The control manipulability.
}

window.addEventListener('load', function() {
    // Initialize the option controls.
    options.isActivated.checked = JSON.parse(localStorage.isActivated);
                                         // The display activation.
    options.frequency.value = localStorage.frequency;
                                         // The display frequency, in minutes.
    
    if (!options.isActivated.checked) { 
        ghost(true); 
    }
    
    // Set the display activation and frequency.
    options.isActivated.onchange = function() {
        var isActivated = options.isActivated.checked;
        localStorage.isActivated = isActivated;
        ghost(!isActivated);
        if (isActivated) {
            background.startMonitoring();
        } else {
            background.stopMonitoring();
        }
    };
    
    options.frequency.onchange = function() {
        localStorage.frequency = options.frequency.value;
    };
});
