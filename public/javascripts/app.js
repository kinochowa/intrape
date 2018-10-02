$(function() {
    $('#importdata').click(function() {

        $("#messageOK").hide();
        $("#messageKO").hide();
        $("#messageInfo").show().html("Upload ...");

        formdata = new FormData();
        if($('#file').prop('files').length > 0) {
            file = $('#file').prop('files')[0];
            formdata.append("file", file);
        } else {
            $("#messageKO").show().html("Select a file.");
            return;
        }

        jQuery.ajax({
            url: "/students/upload",
            type: "POST",
            data: formdata,
            processData: false,
            contentType: false,
            success: function (result) {
                $("#messageInfo").show().html("Processing ...");
                $.post( "/students/import/" + result['file_name'], function() {
                }).done( function(data1) {
                    $("#messageInfo").hide()
                    $("#messageOK").show().html("Data imported successfully.");
                }).fail( (error1) => {
                    $("#messageInfo").hide()
                    $("#messageKO").show().html("Import failed.");
                });
            },
            error: function (error) {
                $("#messageInfo").hide()
                $("#messageKO").show().html("Upload failed.");
            }
        });

    });
})