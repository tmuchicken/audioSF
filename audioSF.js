'use strict';

//audio処理用
window.AudioContext = window.AudioContext || window.webkitAudioContext; 

var micList = document.getElementById("mic_list");
var localStream = null;
var localStream1 = null;
let peer = null;
let existingCall = null;
var videoContainer = document.getElementById('container');
var localVideo = document.getElementById('local_video');
var sound = null;

function stopVideo() {
    localVideo.pause();
    location.reload(true);
    if (localVideo.srcObject) {
      localVideo.srcObject = null;
    }
    else {
      localVideo.src = "";
    }
  
    if (localStream) {
     stopStream(localStream);
     localStream = null;
    }
}

function stopStream(stream) {
    if (!stream) {
     console.warn('NO stream');
     return;
    }
      
    var tracks = stream.getTracks();
    if (! tracks) {
     console.warn('NO tracks');
     return;
    }
  
    for (index in tracks) {
     tracks[index].stop();
    } 
}  

 function logStream(msg, stream) {
  console.log(msg + ': id=' + stream.id);

  var audioTracks = stream.getAudioTracks();
  if (audioTracks) {
   console.log('audioTracks.length=' + audioTracks.length);
   for (var i = 0; i < audioTracks.length; i++) {
    var track = audioTracks[i];
    console.log(' track.id=' + track.id);
   }
  }
}

 function clearDeviceList() {
  while(micList.lastChild) {
   micList.removeChild(micList.lastChild);
  }
}

 function addDevice(device) {
  if (device.kind === 'audioinput') {
   var id = device.deviceId;
   var label = device.label || 'microphone'; // label is available for https 
   var option = document.createElement('option');
   option.setAttribute('value', id);
   option.innerHTML = label + '(' + id + ')';;
   micList.appendChild(option);
  }
  else if (device.kind === 'audiooutput') {
    var id = device.deviceId;
    var label = device.label || 'speaker'; // label is available for https 
 
    var option = document.createElement('option');
    option.setAttribute('value', id);
    option.innerHTML = label + '(' + id + ')'; 
   }

  else {
   console.error('UNKNOWN Device kind:' + device.kind);
  }
 }


 function getDeviceList() {
  clearDeviceList();
  navigator.mediaDevices.enumerateDevices()
  .then(function(devices) {
   devices.forEach(function(device) {
    console.log(device.kind + ": " + device.label +
                " id = " + device.deviceId);
    addDevice(device);
   });
  })
  .catch(function(err) {
   console.error('enumerateDevide ERROR:', err);
  });
 }

 function getSelectedAudio() {
  var id = micList.options[micList.selectedIndex].value;
  return id;
 }

 //メインで動かしている関数
 function startSelectedAudioStereo() {
  var audioId = getSelectedAudio();
  console.log('selected audio=' + audioId);
  var constraints = {
    audio: {
     deviceId: audioId,
    /*//Google用
     googEchoCancellation:false,
     googAutoGainControl: false,
     googNoiseSuppression: true,
    */
     //FireFox用
     echoCancellation:false,
     noiseSuppression:true,
     //autoGainControl:false,
     //noiseSuppression:true,
    }
    };

  console.log('mediaDevice.getMedia() constraints:', constraints);

  navigator.mediaDevices.getUserMedia(
    constraints
   ).then(function(stream) {
     console.log('1streamきてる');
     logStream('selectedVideo', stream);
         //AudioContextを作成
         var context1  = new AudioContext();
         //sourceの作成
         var source1 = context1.createMediaStreamSource(stream);
         //panner の作成
         var panner1 = context1.createPanner();
         source1.connect(panner1);

        //filterの作成
        var biquadFilter = new context1.createBiquadFilter();
        biquadFilter.type = 'highpass'; //ハイパスフィルター
        biquadFilter.frequency.value = 400; //Hz閾値
        //biquadFilter.gain.value = -50; //gainの強さ シェルフィルタの時のみ使用
        panner1.connect(biquadFilter);

         //peer1の作成
         var peer1 = context1.createMediaStreamDestination();
         biquadFilter.connect(peer1); //ココの先頭変えるよ 元はpanner1
         localStream1 = peer1.stream;
 
     logStream('selectedVideo', stream);
   }).catch(function(err){
    console.error('getUserMedia Err:', err);
   });
 };

 function startSelectedVideoAudio(sound) {
    var audioId = getSelectedAudio();
    console.log('selected audio=' + audioId);
    var constraints = {
      audio: {
       deviceId: audioId,
      /*//Google用
       googEchoCancellation:false,
       googAutoGainControl: false,
       googNoiseSuppression: true,
      */
       //FireFox用
       echoCancellation:false,
       autoGainControl:false,
       noiseSuppression:true,
      }
      };
  
    console.log('mediaDevice.getMedia() constraints:', constraints);
  
    navigator.mediaDevices.getUserMedia(
   constraints
  ).then(function(stream) {
    console.log('1streamきてる');
    logStream('selectedVideo', stream);
    //localVideo.srcObject = stream;
        //AudioContextを作成
        var context1  = new AudioContext();
        //sourceの作成
        var source1 = context1.createMediaStreamSource(stream);
        //panner の作成
        var panner1 = context1.createPanner();
        source1.connect(panner1);
        //peer1の作成
        var peer1 = context1.createMediaStreamDestination();
        //StereoPannner作成
        var StereoPanner = context1.createStereoPanner();
        panner1.connect(StereoPanner);
        StereoPanner.pan.value = sound;

        StereoPanner.connect(peer1); //ココの先頭変えるよ
        localStream1 = peer1.stream;

    logStream('selectedVideo', stream);
  }).catch(function(err){
   console.error('getUserMedia Err:', err);
  });
   };



 navigator.mediaDevices.ondevicechange = function (evt) {
  console.log('mediaDevices.ondevicechange() evt:', evt);
 };


//peeridを取得
function getpeerid(id) {
    //ボタンをすべて消す　PeerIDがサーバーに残ってしまい初期化ができない
    $('#peerid-ui').hide();

    //peerオブジェクトの作成
    peer = new Peer(id,{
        key: '6cee6718-08d3-4ce7-93a9-237ecd4601bb',    //APIkey
        debug: 3
    });

    start();//イベント確認
}
///////////////////////


function quick(){
    startSelectedAudioStereo();
    getpeerid("ALR1");
    $('#callto-id').val("ln1");
    Promise.resolve()
  .then(wait(2)) // ここで10秒待つ（「Promiseオブジェクトを返す関数」を thenに渡しています）
  .then(function() {
    // ここに目的の処理を書きます。
    const call = peer.call($('#callto-id').val(), localStream1); 
    setupCallEventHandlers(call);
    })
  .catch(function (err) {
    console.error(err);
    self.result_message = error;
  });
};
   
var wait = function(sec) {
    return function() {
        return new Promise(function(resolve/*, reject*/) {
        setTimeout(resolve, sec*1000)
        });
    }
  };
      
    
//オーディオシステムの選択
$('#start_video_button_L').click(function () {
    startSelectedVideoAudio(-1);
});

$('#start_video_button_R').click(function () {
    startSelectedVideoAudio(1);
});

$('#start_video_button_W').click(function () {
    startSelectedAudioStereo();
});


//peeridの選択
$('#AudioLR1').click(function () {
    getpeerid("ALR1");
    $('#callto-id').val("ln1");
});

$('#AudioLR2').click(function () {
    getpeerid("ALR2");
    $('#callto-id').val("ln2");
});

$('#AudioL1').click(function () {
    getpeerid("AL1");
    $('#callto-id').val("AUL1");
});

$('#AudioL2').click(function () {
    getpeerid("AL2");
    $('#callto-id').val("AUL2");
});

$('#AudioR1').click(function () {
    getpeerid("AR1");
    $('#callto-id').val("AUR1");
});

$('#AudioR1').click(function () {
    getpeerid("AR2");
    $('#callto-id').val("AUR2");
});

$('#AudioUserL1').click(function () {
    getpeerid("AUL1");
    $('#callto-id').val("AL1");
    isReceive = true;
});

$('#AudioUserL2').click(function () {
    getpeerid("AUL2");
    $('#callto-id').val("AL2");
    isReceive = true;
});

$('#AudioUserR1').click(function () {
    getpeerid("AUR1");
    $('#callto-id').val("AR1");
    isReceive = true;
});

$('#AudioUserR2').click(function () {
    getpeerid("AUR2");
    $('#callto-id').val("AR2");
    isReceive = true;
});


$('#random').click(function () {
    getpeerid(null);
});


//イベント id取得後じゃないと動作しない
function start() {
    //openイベント
    peer.on('open', function () {
        $('#my-id').text(peer.id);
    });

    //errorイベント
    peer.on('error', function (err) {
        alert(err.message);
        setupMakeCallUI();
    });

    //closeイベント
    peer.on('close', function () {
        alert(err.message);
        setupMakeCallUI();
    });

    //disconnectedイベント
    peer.on('disconnected', function () {
        alert(err.message);
        setupMakeCallUI();
    });

    //着信処理
    peer.on('call', function(call){
        call.answer(localStream1);
        setupCallEventHandlers(call);
    });
}


/*
///////////////open,error,close,disconnectedイベント
peer.on('open', function(){         //発火する
    $('#my-id').text(peer.id);      //Peer IDの自動作成タイム
});

peer.on('error', function(err){
    alert(err.message);
});

peer.on('close', function(){
});

peer.on('disconnected', function(){
});
//////////////////////////
*/

///////////////発信処理・切断処理・着信処理
$('#make-call').submit(function(e){
    e.preventDefault();
    const call = peer.call($('#callto-id').val(), localStream1); 
    setupCallEventHandlers(call);
    });

$('#end-call').click(function(){
    existingCall.close();
});


/////////////////////


//////////Callオブジェクトに必要なイベント
function setupCallEventHandlers(call){
    if (existingCall) {
        existingCall.close();
    };

    existingCall = call;

    
    setupEndCallUI(call);

    call.on('stream', function(stream){
        addVideo(call,stream);
        setupEndCallUI();
        $('#their-id').text(call.remoteId);
    });
    call.on('close', function(){
        removeVideo(call.remoteId);
        setupMakeCallUI();
    });
}
//////////////////////////////////


///////////video要素の再生・削除・ボタン表示
function addVideo(call,stream){
    $('#their-video').get(0).srcObject = stream;
}

function removeVideo(peerId){
    $('#'+peerId).remove();
}

function setupMakeCallUI(){
    $('#make-call').show();
    $('#end-call').hide();
}


function setupEndCallUI() {
    $('#make-call').hide();
    $('#end-call').show();
    //$('#their-id').text(call.remoteId);
}
//////////////////////////////////////
