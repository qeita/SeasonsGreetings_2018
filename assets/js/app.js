'use strict';

( () => {
  let controls, camera, scene, renderer, raycaster; // Three.js用変数
  let container; // DOM変数

  /**
   * 独自変数
   */
  let light, ambient;
  let fireElement;
  let prevTime, now;
  let timer = null;

  let content = document.getElementById('content');
  let header = content.children[0];
  let main = content.children[1];

  let textArea = document.querySelector('.content__txt');
  let bar = document.querySelector('.indicator__bar');
  let scroll = 0;
  let gauge = 0;

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
    fireElement.mesh.position.set(0, 0.5, -2);
    scene.add(fireElement.mesh);

    prevTime = Date.now();

    attachEv();
  }


  /**
   * イベントをアタッチ
   */
  function attachEv(){
    /**
     * イベント判定
     * ref: http://chibinowa.net/note/js/threejs-obj-mouse.html
     */
    // raycaster = new THREE.Raycaster();
    // renderer.domElement.addEventListener('click', (e) => {
    //   let mouse = new THREE.Vector2();
    //   mouse.x = (e.clientX / window.innerWidth) * 2 - 1
    //   mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
    //   raycaster.setFromCamera(mouse, camera);
    //   let intersect = raycaster.intersectObject(box);
    //   if(intersect.length > 0){
    //   }
    // });

    /**
     * リサイズイベント
     */
    window.addEventListener('resize', () => {
      resize();
    }, false);

    // ゲージ幅表示
    function setBarWidth(){
      gauge = window.innerWidth * fireElement.material.uniforms.size.value/5.0;
      if(gauge > 0 && gauge < window.innerWidth){
        bar.style.width = gauge + 'px';
      }
    }

    function getPosition(e){
      if(device === 'sp' || device === 'tab'){
        return e.touches[0].pageY;
      }else{
        return e.pageY;
      }
    }

    /**
     * クリックイベント
     */
    window.addEventListener(evType.down, (e) => {
      clearTimeout(timer);

      if(!content.classList.contains('content--show')){
        content.classList.add('content--show');
      }

      // ポジション取得
      base_y = getPosition(e);

      let fireScaleAnim = () => {
        timer = setTimeout( () => {
          fireElement.material.uniforms.size.value += 0.01;

          // ゲージ表示
          setBarWidth();
    
          fireScaleAnim();
        }, 1000/60);
      }
      fireScaleAnim();

    }, false);

    window.addEventListener(evType.move, (e) => {
      // ポジション取得
      y = getPosition(e);
      if(y && base_y){
        if(y < base_y){
          scroll++;
        }else{
          scroll--;
        }
        textArea.style.transform = 'translate(0, ' + scroll + 'px)';
      }

    }, false);

    window.addEventListener(evType.up, () => {
      clearTimeout(timer);

      y = null;
      base_y = null;

      let fireScaleAnim = () => {
        timer = setTimeout( () => {
          fireElement.material.uniforms.size.value -= 0.01;

          // ゲージ表示
          setBarWidth();

          if(fireElement.material.uniforms.size.value <= 0.0){
            clearTimeout(timer);
            fireElement.material.uniforms.size.value = 0.0;
          }else{
            fireScaleAnim();
          }
        }, 1000/60);
      }
      fireScaleAnim();      
    }, false);

  }

  /**
   * レンダラーリサイズ
   */
  function resize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
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
    renderer.render(scene, camera);
  }

})();