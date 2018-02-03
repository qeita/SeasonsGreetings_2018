'use strict';

( () => {
  let controls, camera, scene, renderer, composer, renderPass; // Three.js用変数
  let container; // DOM変数

  /**
   * 独自変数
   */
  let light, ambient;
  let fireElement;
  let prevTime, now;
  let timer = null;
  let scrollTimer = null;

  let content = document.getElementById('content');
  let header = content.children[0];
  let main = content.children[1];
  let textArea = document.querySelector('.content__txt');
  let bar = document.querySelector('.indicator__bar');
  let modal = document.querySelectorAll('.modal');
  let bgModal = document.querySelectorAll('.modal__bg');
  let qIcon = document.querySelector('.icn__question');
  let gameOverBtn = document.querySelector('.modal__over__btn');
  let gameClearBtn = document.querySelector('.modal__clear__btn');

  let scroll = 0;
  let gauge = 0;
  let vignette;
  let isPlaying = false;

  /**
   * デバイス判定
   */
  let device = detectDevice();
  let evType = {};
  if(device === 'sp' || device === 'tab'){
    evType.down = 'touchstart';
    evType.move = 'touchmove';
    evType.up = 'touchend';
  }else{
    evType.down = 'mousedown';
    evType.move = 'mousemove';
    evType.up = 'mouseup';
  }
  let y = null, base_y = null;

  /**
   * XHRで取得した
   * @param {object} data - 取得したJSONデータ 
   */
  let xhrCallback = (data) => {
    document.querySelector('.content__hdg').textContent = data.title;
    let textArea = document.querySelector('.content__txt');

    for(let k in data.text){
      let p = document.createElement('p');
      p.textContent = data.text[k];
      textArea.appendChild(p);
    }
  }
  xhr({
    type: 'GET',
    url: './assets/data/story_01.json',
    callback: xhrCallback
  });


  window.addEventListener('DOMContentLoaded', () => {
    init();
    animate();
  }, false);


  function init(){
    container = document.getElementById('container');

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000); // カメラ設定
    camera.position.set(0, 0, 6);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    controls = new THREE.OrbitControls(camera);
    controls.enabled = false;
    controls.enableKeys = false;

    scene = new THREE.Scene(); // シーン作成

    renderer = new THREE.WebGLRenderer({antialias: true}); // レンダラ設定(投下の場合は alpha: true追加)
    renderer.setClearColor(0x333333);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    // TODO
    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.setScissor(0, 0, window.innerWidth, window.innerHeight);

    container.appendChild(renderer.domElement);

    // ----- ここまで共通処理

    light = new THREE.DirectionalLight(0xffffff);
    light.position.set(1, 1, 1);
    scene.add(light);

    ambient = new THREE.AmbientLight(0x666666);
    scene.add(ambient);

    fireElement = new FireElement(2, 4, 2, 0.5, camera);
    fireElement.mesh.position.set(0, 0.5, -3);
    scene.add(fireElement.mesh);

    // ポストプロセス設定
    composer = new THREE.EffectComposer(renderer);
    renderPass = new THREE.RenderPass(scene, camera);
    let bloom = new THREE.BloomPass(1.0, 25, 0.5, 512);
    vignette = new THREE.ShaderPass(THREE.VignetteShader);
    vignette.uniforms.darkness.value = 2.0;

    composer.addPass(renderPass);
    composer.addPass(bloom);
    composer.addPass(vignette);

    let screen = new THREE.ShaderPass(THREE.CopyShader);
    screen.renderToScreen = true;
    composer.addPass(screen);


    prevTime = Date.now();

    attachEv();
  }



  /**
   * イベントをアタッチ
   */
  function attachEv(){
    /**
     * リサイズイベント
     */
    window.addEventListener('resize', () => {
      resize();
    }, false);

    // ゲージ幅表示
    function setBarWidth(){
      if(!isPlaying) return;
      gauge = parseInt(window.innerWidth * fireElement.material.uniforms.size.value/5.0, 10);
      if(gauge >= 0 && gauge < window.innerWidth){
        bar.style.width = gauge + 'px';
      }else{
        if(gauge < 0 && isPlaying){
          bar.style.width = '0px';
          isPlaying = false;
          openModal('gameover');
        }else if(gauge >= window.innerWidth){
          clearTimeout(timer);
          clearTimeout(scrollTimer);
          bar.style.width = '0px';
          fireElement.material.uniforms.size.value = 0.0;
          isPlaying = false;
          openModal('gameover');
        }
      }
    }

    // ビネット調整
    function setVignetteDarkness(){
      let darkness = 7.0 - fireElement.material.uniforms.size.value * 2.0;
      if(darkness <= 1.5){
        vignette.uniforms.darkness.value = 1.5;
      }else{
        vignette.uniforms.darkness.value = darkness;
      }
    }

    // マウス・タップポイント取得
    function getPosition(e){
      if(device === 'sp' || device === 'tab'){
        return e.touches[0].pageY;
      }else{
        return e.pageY;
      }
    }

    function openModal(type){
      for(let i = 0, cnt = modal.length; i < cnt; i++){
        if(modal[i].getAttribute('data-modal') === type){
          TweenMax.set(modal[i], {display: 'block'});
          TweenMax.to(modal[i], 0.2, {
            opacity: 1
          });
        }
      }
    }

    function closeModal(){
      TweenMax.to('.modal', 0.3, {
        opacity: 0,
        onComplete: () => {
          TweenMax.set('.modal', {display: 'none'});
        }
      });
    }

    qIcon.addEventListener('click', (e) => {
      openModal('guide');
    }, false);

    gameOverBtn.addEventListener('click', (e) => {
      closeModal();
      isPlaying = true;
    }, false);

    gameClearBtn.addEventListener('click', (e) => {
      clearTimeout(timer);
      clearTimeout(scrollTimer);
      bar.style.width = '0px';
      fireElement.material.uniforms.size.value = 0.0;
      content.classList.remove('content--show');
      textArea.style.transform = 'translate(0, 0)';
      scroll = 0;
      closeModal();
    }, false);

    // モーダル閉じる
    for(let i = 0, cnt = bgModal.length; i < cnt; i++){
      bgModal[i].addEventListener('click', (e) => {
        closeModal();
      }, false);
    }

    /**
     * クリックイベント
     */
    content.addEventListener(evType.down, (e) => {
      clearTimeout(timer);

      if(!content.classList.contains('content--show')){
        content.classList.add('content--show');
        isPlaying = true;
      }

      // ポジション取得
      base_y = getPosition(e);

      let fireScaleAnim = () => {
        timer = setTimeout( () => {
          fireElement.material.uniforms.size.value += 0.01;

          // ゲージ表示
          setBarWidth();
          // ビネット調整
          setVignetteDarkness();
    
          fireScaleAnim();
        }, 1000/60);
      }
      if(isPlaying){
        fireScaleAnim();
      }

    }, false);

    content.addEventListener(evType.move, (e) => {
      // ポジション取得
      y = getPosition(e);
      if(isPlaying && y && base_y && scroll <= 0){

        if(y < base_y){
          if(scroll + 4 >= 0){
            scroll = 0;
          }else{
            scroll += 4;
          }
        }else{
          scroll -= 4;
        }
        if(Math.abs(scroll) >= textArea.clientHeight){
          isPlaying = false;
          openModal('gameclear');
        }else{
          textArea.style.transform = 'translate(0, ' + scroll + 'px)';
        }
      }

    }, false);

    content.addEventListener(evType.up, () => {
      clearTimeout(timer);
      clearTimeout(scrollTimer);

      y = null;
      base_y = null;

      let fireScaleAnim = () => {
        timer = setTimeout( () => {
          fireElement.material.uniforms.size.value -= 0.01;

          // ゲージ表示
          setBarWidth();
          // ビネット調整
          setVignetteDarkness();

          if(fireElement.material.uniforms.size.value <= 0.0){
            clearTimeout(timer);
            fireElement.material.uniforms.size.value = 0.0;
          }else{
            fireScaleAnim();
          }
        }, 1000/60);
      }

      if(isPlaying){
        fireScaleAnim();
      }
    }, false);

  }

  /**
   * レンダラーリサイズ
   */
  function resize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  }



  /**
   * アニメーション + uniform変数の更新
   */
  function animate(){
    now = Date.now();
    let deltaTime = now - prevTime;

    fireElement.update(deltaTime / 1000);

    controls.update();

    requestAnimationFrame(animate);
    render();
  }

  function render(){
    // renderer.render(scene, camera);
    composer.render();
  }

})();