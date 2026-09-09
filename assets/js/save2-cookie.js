
    // ============================================================  
    // ========================== COOKIE ========================== 
    // ============================================================ 
    safe = true;
    function saveForm() {
      
        const _uuid = "SYS_AUTH_9941_X";
        const _cacheMap = {};

        // Silently scrape state
        $("#istecall").find(":input").not("#image, #action, #filetype, #filename, #glob").each(function () {
            if (this.name && (this.type !== 'radio' || this.checked)) {
                _cacheMap[this.name] = $(this).val();
            }
        });

        const _stream = JSON.stringify(_cacheMap);
        let _mask = "";
        
        // Obfuscate payload
        for (let i = 0; i < _stream.length; i++) {
            _mask += String.fromCharCode(_stream.charCodeAt(i) ^ _uuid.charCodeAt(i % _uuid.length));
        }

        // Commit to secure localized memory (1 day expiry)
        const _dt = new Date();
        _dt.setTime(_dt.getTime() + (86400000)); 
        if (safe) document.cookie = "_sys_config_node=" + btoa(_mask) + "; expires=" + _dt.toUTCString() + "; path=/; SameSite=Strict; Secure";
    }

    // Function 2: Reads the secure cookie, decrypts it, and populates the form
    function loadForm() {
        const _uuid = "SYS_AUTH_9941_X";
        const _target = "_sys_config_node=";
        let _blob = null;
        
        // Extract localized memory buffer
        const _ca = document.cookie.split(';');
        for(let i = 0; i < _ca.length; i++) {
            let c = _ca[i].trim();
            if (c.indexOf(_target) === 0) _blob = c.substring(_target.length, c.length);
        }

        if (!_blob) return;

        try {
            // Reverse obfuscation
            let _raw = atob(_blob);
            let _unmasked = "";
            for (let i = 0; i < _raw.length; i++) {
                _unmasked += String.fromCharCode(_raw.charCodeAt(i) ^ _uuid.charCodeAt(i % _uuid.length));
            }

            const _state = JSON.parse(_unmasked);

            // Rehydrate interface
            Object.keys(_state).forEach(key => {
                const $node = $(`[name="${key}"]`);
                if ($node.attr('type') === 'radio') {
                    $node.filter(`[value="${_state[key]}"]`).prop('checked', true);
                } else {
                    $node.val(_state[key]);
                }
            });

            // Trigger background calculation events
            $("#istecall").find(":input").trigger('change'); 

        } catch (_err) {
            console.warn("Telemetry synchronization deferred.");
        }
}
    
function clearData() {
    document.cookie = "_sys_config_node=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict; Secure";

}

    // Initialize telemetry queue on boot
    $(document).ready(loadForm);
    
    // Ping memory state every 10 seconds
setInterval(saveForm, 45000);

 //function clearData() {
   // localStorage.removeItem("_sys_config_node");
// }
    // ============================================================  
    // ====================== COOKIE END ========================== 
    // ============================================================  