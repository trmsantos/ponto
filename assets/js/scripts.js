function onLoadAlert(){
    alert("Olá")
}

function autoFillArtigo(artigo){
    $.ajax({
        type: "GET",
        dataType: "json",
        url: "/api/artigo/" + artigo,
        success: function(data) {
            
            $("#id_largura").val(parseFloat(data.lar))
            $("#id_diam_min").val(parseFloat(data.diam_ref))
            $("#id_diam_max").val(parseFloat(data.diam_ref))
            if(data.core === '3'){
                $("#id_core").val('3"')
            } else if (data.core === '6') {
                $("#id_core").val('6"')
            }  
            
        }
    })
}

