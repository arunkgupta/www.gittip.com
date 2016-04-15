/**
 * Display a notification
 * Valid notification types are: "notice", "error", and "success".
 */
Gratipay.notification = function(text, type, timeout, closeCallback) {
    var type = type || 'notice';
    var timeout = timeout || (type == 'error' ? 10000 : 5000);

    var dialog = ['div', { 'class': 'notification notification-' + type }, [ 'div', text ]];
    var $dialog = $([
        Gratipay.jsonml(dialog),
        Gratipay.jsonml(dialog)
    ]);

    // Close if we're on the page the notification links to.
    var links = $dialog.eq(1).find('a');
    if (links.length == 1 && links[0].pathname == location.pathname) {
        return closeCallback()
    }

    if (!$('#notification-area').length)
        $('body').prepend('<div id="notification-area"><div class="notifications-fixed"></div></div>');

    $('#notification-area').prepend($dialog.get(0));
    $('#notification-area .notifications-fixed').prepend($dialog.get(1));

    function close() {
        $dialog.fadeOut(null, $dialog.remove);
        if (closeCallback) closeCallback();
    }

    $dialog.append($('<span class="btn-close">&times;</span>').click(close));
    if (timeout > 0) setTimeout(close, timeout);
};

Gratipay.initNotifications = function(notifs) {
    jQuery.each(notifs, function(k, notif) {
        Gratipay.notification(notif.jsonml, notif.type, -1, function() {
            jQuery.ajax({
                url: '/~'+Gratipay.username+'/notifications.json',
                type: 'POST',
                data: {remove: notif.name},
                dataType: 'json',
                error: Gratipay.error,
            });
        });
    });
};
