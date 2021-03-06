(function(window){
    var Track = function(input){
        this.mute = false;
        this.empty = true;
        this.recording = false;
        this.recorder = new Recorder(input, {workerPath: '/js/recorder/recorderWorker.js'});
        this.buffer = null;
        this.playback;
        this.gainNode;
        this.volume = 80;
    }; 

    Track.prototype.save = function(buffers){
        var newBuffer = audioContext.createBuffer( 2, buffers[0].length, audioContext.sampleRate );
        newBuffer.getChannelData(0).set(buffers[0]);
        newBuffer.getChannelData(1).set(buffers[1]);
        this.buffer = newBuffer;
        this.empty = false;
    }

    Track.prototype.play = function(){
        this.playback = audioContext.createBufferSource();
        this.gainNode = audioContext.createGainNode();
        this.playback.buffer = this.buffer;
        this.playback.connect( this.gainNode );
        this.gainNode.connect(audioContext.destination);
        this.setVolume(this.volume);
        this.playback.noteOn(0);     
    };

    Track.prototype.stop = function(){
        var me = this;
        //stop playback
        if(typeof me.playback !== "undefined"){
            me.playback.noteOff(0);
        }
        //stop recording
        if(this.recording){
            me.recording = false;
            me.recorder.stop();
            me.recorder.getBuffer(function(buffers){
                me.save(buffers);
            });
        }
    };
    Track.prototype.setVolume = function(level){
        this.volume = level;
        var percent = level / 100;
        var gainRange = this.gainNode.gain.maxValue - this.gainNode.gain.minValue;
        this.gainNode.gain.value = gainRange * percent;
    };

    Track.prototype.startRecord = function(){
        this.recording = true;
        this.recorder.clear();
        this.empty = true;
        this.recorder.record();
    };

    //15 second track limit which is about 2.5mb for a wav
    var audioContext = null,
        tracks = [],
        recorderSource = null,
        selectedTrack = null,
        four = 4,
        playing = false,
        recording = false;

    function canRecord() {
      return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia || navigator.msGetUserMedia);
    }

    var FourTracker = function(){
        audioContext = new window.webkitAudioContext();
        navigator.webkitGetUserMedia({video: false, audio: true}, startStream, failToGetMedia); 
    };

    FourTracker.prototype.startRecord = function(){
        //eventually choose correct track to record
        selectedTrack.startRecord();
    };

    FourTracker.prototype.stopRecord = function(){
        //eventually choose correct track to stop recording
        selectedTrack.stop();
    };

    FourTracker.prototype.toggleRecord = function(){
        if(!recording){
            this.stopRecord();
        }else{
            this.startRecord();
        }
    };

    FourTracker.prototype.startPlay = function(){
        for(var i = 1; i <= four; i += 1){
            if(!tracks[i].empty && !tracks[i].mute && !tracks[i].recording){
                tracks[i].play();
            }
        }
        playing = true;
    };

    FourTracker.prototype.stopPlay = function(){
        for(var i = 1; i <= four; i += 1){
            tracks[i].stop();
        }
        playing = false;
    };

    FourTracker.prototype.togglePlay = function(){
        if(playing){
            this.stopPlay();
        }else{
            this.startPlay();
        }
    };

    FourTracker.prototype.ok = function(){
        return canRecord();
    };

    FourTracker.prototype.getRawAudio = function(callback){
        tracks[1].recorder.exportWAV(callback);
    };

    FourTracker.prototype.setRecordTrack = function(number){
        console.log("track number set to: " + number);
        selectedTrack = tracks[number];
    };

    FourTracker.prototype.toggleMuteTrack = function(number){
        tracks[number].mute = !tracks[number].mute;
    };

    FourTracker.prototype.setTrackVolume = function(number, level){
        tracks[number].setVolume(level);
    };

    function failToGetMedia(e){
        console.log("Problem getting audio: ", e);
    } 
    
    function startStream(audioStreamIn){
        var input = audioContext.createGainNode();
        var microphone = audioContext.createMediaStreamSource(audioStreamIn);
        microphone.connect(input);
        for(var i = 1; i <= four; i += 1){
            tracks[i] = new Track(input);
        }
        selectedTrack = tracks[1];
    }

    window.FourTracker = new FourTracker();
})(window);
