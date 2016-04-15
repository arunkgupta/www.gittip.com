Gratipay.profile = {};

Gratipay.profile.init = function() {

    // Wire up textarea for statement.
    // ===============================

    $('textarea').focus();

    Gratipay.forms.jsEdit({
        confirmBeforeUnload: true,
        root: $('.statement.js-edit'),
    });

    $('.statement textarea').on('change keyup paste', function(){
        var changed = $(this).val() !== $(this).data('original');
        $('.statement button.save').prop('disabled', !changed);
    });

    $('.statement select.langs').on('change', function(e){
        var $form = $('.statement form');
        var $inputs = $form.find('button, input, select, textarea').filter(':not(:disabled)');
        var $textarea = $form.find('textarea');
        var $this = $(this);
        var lang = $this.val();
        if ($textarea.val() !== $textarea.data('original')) {
            if(!confirm($textarea.data('confirm-discard'))) {
                $this.val($this.data('value'));
                return;
            }
        }
        $inputs.prop('disabled', true);
        $textarea.val("Loading...");
        $.ajax({
            url: 'statement.json',
            data: {lang: lang},
            dataType: 'json',
            success: function (d) {
                $inputs.prop('disabled', false);
                $textarea.attr('lang', lang);
                $textarea.val(d.content || "");
                $textarea.data('original', $textarea.val());
                $form.find('button.save').prop('disabled', true);
                $this.data('value', lang);
            },
            error: [
                function () { $inputs.prop('disabled', false); },
                Gratipay.error,
            ]
        });
    });

    $('.statement button.edit').on('click', function(){
        $('.statement textarea').val('').data('original', '');
        $('.statement select.langs').change();
    });

    if ($('.statement div.view').html().trim() === '') {
        $('.statement button.edit').click();
    }


    // Wire up cryptocoin inputs.
    // ==========================

    $('tr.cryptocoin.js-edit').each(function() {
        var $root = $(this);
        Gratipay.forms.jsEdit({
            root: $root,
            success: function(){
                var addr = $root.find('[name="address"]').val();
                $root.find('.view').text(addr);
                $root.find('button.delete').data('address', addr);
                $root.addClass('not-empty');
            },
        });
        $root.find('button.delete').click(Gratipay.routes.deleteRoute);
    });


    // Wire up account deletion.
    // =========================

    $('.account-delete').on('click', function () {
        var $this = $(this);

        jQuery.ajax({
            url: "delete-elsewhere.json",
            type: "POST",
            dataType: "json",
            success: function ( ) {
                location.reload();
            },
            error: Gratipay.error,
            data: { platform: this.dataset.platform, user_id: this.dataset.user_id }
        });

        return false;
    });

    // Wire up user_name_prompt
    // ========================

    $('.user_name_prompt').on('click', function () {
        var user_name = prompt('Please enter the name of the GitHub account you would like to connect:');
        if(!user_name) return false;
        $(this).children('[name="user_name"]').val(user_name);
    });

};
