var debug_timing = false
$().ready(function(){
  var state = 0,
      STATE_LOADING = 0,
      STATE_READY = 1,
      STATE_CHECKING = 2,
      STATE_ERROR = 3

  var ANIMATION_SPEED = 20

  var legal_cards = []

  //filter out funky letters
  var REPLACEMENTS = [
    { from:/é/g, to:"e" },
    { from:/û/g, to:"u" },
    { from:/ú/g, to:"u" },
    { from:/â/g, to:"a" },
    { from:/í/g, to:"i" },
    { from:/Æ/g, to:"AE" },
    { from:/æ/g, to:"ae" }
  ]

  function time_it(){
    if(!debug_timing){
      return false
    }
    var d = new Date()
    console.log('time', d.getSeconds(), d.getMilliseconds())
  }

  function fuzzy_reduce(card_name){
    REPLACEMENTS.forEach(function(replacement){
        card_name = card_name.replace(replacement.from, replacement.to);
    });
    if (card_name.indexOf("/") >= 0 && card_name.indexOf("//") == -1) {
        card_name = card_name.replace("/", "//");
    }
    if (card_name.indexOf("//") >= 0 && card_name.indexOf(" // ") == -1) {
        card_name = card_name.replace("//", " // ");
    }
    return card_name.toLowerCase();
}

  function loaded_legal_cards(data, status){
    if(status == 'success'){
      load_legal_cards_success(data)
    }else{
      $("#nLoading").hide(ANIMATION_SPEED)
      $("#nError").show(ANIMATION_SPEED)
    }
  }

  //reached while loading from page or from server
  function load_legal_cards_success(data){
      legal_cards = data.split('\n').map(fuzzy_reduce)
      // console.log("legal cards:",legal_cards)
      state = STATE_READY
      $("#nLoading").hide(ANIMATION_SPEED)
      $("#nCheckButton").show(ANIMATION_SPEED)
  }

  //check lines with these formats, ignore other lines:
  //15 Forest
  //10x Swamp
  var CARD_REGEX = /^([\d]+)x?\s+(.+?)$/
  function check_decklist(decklist){
    var illegal_cards = [],
        all_cards = [],
        card_count = 0

    //todo: make this more friendly so it doesn't freeze the browser? seems to run fast enough.
    function start_checking(){
      time_it()

      //filter out all non-formatted lines
      var card_lines = decklist.split('\n').filter(function(card_line){
        return CARD_REGEX.test(card_line)
      })

      //read each line into a card-object
      all_cards = card_lines.map(function(card_line){
        var data = CARD_REGEX.exec(card_line)
        return {
          fuzzy_name:fuzzy_reduce(data[2].trim()),
          name:data[2].trim(),
          count:data[1]
        }
      })

      //check legality and count
      all_cards.forEach(function(card){
        if(legal_cards.indexOf(card.fuzzy_name)>=0){
          card_count += 1*card.count
        }else{
          illegal_cards.push(card)
        }
      })

      time_it()
      done_checking()
    }

    function done_checking(){

      /* show number of legal cards in deck */
      $("#cardCount").html(card_count+" card"+(card_count!=1?"s":""))
      $("#nContains").show(ANIMATION_SPEED)

      /* show or hide the card count warning */
      if(card_count < 60){
        $("#nFewCards").show(ANIMATION_SPEED)
      }else{
        $("#nFewCards").hide(ANIMATION_SPEED)
      }

      /* show or hide the legal deck notice (legality only, not based on size, not empty) */
      if(illegal_cards.length == 0 && card_count > 0){
        $("#nLegal").show(ANIMATION_SPEED)
      }else{
        $("#nLegal").hide(ANIMATION_SPEED)
      }

      /* show or hide the illegal cards in the deck */
      if(illegal_cards.length == 0){
        $("#nIllegal").hide(ANIMATION_SPEED)
      }else{
        $("#nIllegal").show(ANIMATION_SPEED)
        $("#illegalCards").html(illegal_cards.map(function(card){
          return "<li>"+card.name+"</li>"
        }).join('\n'))
      }


      $("#nCheckButton").show(ANIMATION_SPEED)
      $("#nChecking").hide(ANIMATION_SPEED)

      state = STATE_READY
    }

    return start_checking
  }


  $("#checkButton").on('click',function(){
    if(state != STATE_READY){
      return false
    }

    //start checking the decklist...
    state = STATE_CHECKING
    $("#nCheckButton").hide(ANIMATION_SPEED)
    $("#nChecking").show(ANIMATION_SPEED)
    setTimeout(check_decklist($("#decklist").val()),ANIMATION_SPEED+1)
  })

  /*/
  load_legal_cards_success($("#devLegalCards").html())
  /*/
  $.ajax({
    url: 'legal_cards.txt',
    data: "",
    success: loaded_legal_cards,
    dataType: "text"
  });
  //*/
})