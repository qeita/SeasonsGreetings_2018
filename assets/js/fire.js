/**
 * @private
 */
var prioritySortLow = function(a, b) {
  return b.priority - a.priority;
};

/**
 * @private
 */
var prioritySortHigh = function(a, b) {
  return a.priority - b.priority;
};

/*global PriorityQueue */
/**
 * @constructor
 * @class PriorityQueue manages a queue of elements with priorities. Default
 * is highest priority first.
 *
 * @param [options] If low is set to true returns lowest first.
 */
window.PriorityQueue = function(options) {
  var contents = [];
  var sorted = false;
  var sortStyle;

  if(options && options.low) {
    sortStyle = prioritySortLow;
  }else{
    sortStyle = prioritySortHigh;
  }

  /**
   * @private
   */
  var sort = function() {
    contents.sort(sortStyle);
    sorted = true;
  };

  var self = {
    /**
     * Removes and returns the next element in the queue.
     * @member PriorityQueue
     * @return The next element in the queue. If the queue is empty returns
     * undefined.
     *
     * @see PrioirtyQueue#top
     */
    pop: function() {
      if(!sorted) {
        sort();
      }
      return contents.pop();
    },

    /**
     * Returns but does not remove the next element in the queue.
     * @member PriorityQueue
     * @return The next element in the queue. If the queue is empty returns
     * undefined.
     *
     * @see PriorityQueue#pop
     */
    top: function() {
      if(!sorted) {
        sort();
      }
      return contents[contents.length - 1];
    },

    /**
     * @member PriorityQueue
     * @param object The object to check the queue for.
     * @returns true if the object is in the queue, false otherwise.
     */
    includes: function(object) {
      for(var i = contents.length - 1; i >= 0; i--) {
        if(contents[i].object === object) {
          return true;
        }
      }
      return false;
    },

    /**
     * @member PriorityQueue
     * @returns the current number of elements in the queue.
     */
    size: function() {
      return contents.length;
    },

    /**
     * @member PriorityQueue
     * @returns true if the queue is empty, false otherwise.
     */
    empty: function() {
      return contents.length === 0;
    },

    /**
     * @member PriorityQueue
     * @param object The object to be pushed onto the queue.
     * @param priority The priority of the object.
     */
    push: function(object, priority) {
      contents.push({object: object, priority: priority});
      sorted = false;
    }
  };
  return self;
};


/**
 * Volume fire element
 * 
 * reference:
 * https://qiita.com/edo_m18/items/d0451e4cc0b71dbcf112
 */

function FireElement(width, height, depth, sliceSpacing, camera){
  this.camera = camera;
  
  let halfWidth = width/2;
  let halfHeight = height/2;
  let halfDepth = depth/2;

  this._posCorners = [
    new THREE.Vector3(-halfWidth, -halfHeight, -halfDepth),
    new THREE.Vector3( halfWidth, -halfHeight, -halfDepth),
    new THREE.Vector3(-halfWidth,  halfHeight, -halfDepth),
    new THREE.Vector3( halfWidth,  halfHeight, -halfDepth),
    new THREE.Vector3(-halfWidth, -halfHeight,  halfDepth),
    new THREE.Vector3( halfWidth, -halfHeight,  halfDepth),
    new THREE.Vector3(-halfWidth,  halfHeight,  halfDepth),
    new THREE.Vector3( halfWidth,  halfHeight,  halfDepth),
  ];
  this._texCorners = [
    new THREE.Vector3(0.0, 0.0, 0.0),
    new THREE.Vector3(1.0, 0.0, 0.0),
    new THREE.Vector3(0.0, 1.0, 0.0),
    new THREE.Vector3(1.0, 1.0, 0.0),
    new THREE.Vector3(0.0, 0.0, 1.0),
    new THREE.Vector3(1.0, 0.0, 1.0),
    new THREE.Vector3(0.0, 1.0, 1.0),
    new THREE.Vector3(1.0, 1.0, 1.0),
  ];

  this._viewVector = new THREE.Vector3();
  this._sliceSpacing = sliceSpacing;

  let vsCode = document.getElementById('vs').textContent;
  let fsCode = document.getElementById('fs').textContent;

  let index = new Uint16Array((width + height + depth) * 30);
  let position = new Float32Array((width + height + depth) * 30 * 3);
  let tex = new Float32Array((width + height + depth) * 30 * 3);

  let geometry = new THREE.BufferGeometry();
  geometry.dynamic = true;
  geometry.addAttribute('position', new THREE.BufferAttribute(position, 3));
//   geometry.addAttribute('index', new THREE.BufferAttribute(index, 1));
  geometry.addAttribute('tex', new THREE.BufferAttribute(tex, 3));
  geometry.setIndex(new THREE.BufferAttribute(index, 1));

//   let material = this.createMaterial(vsCode, fsCode);
  this.material = this.createMaterial(vsCode, fsCode);

  this.mesh = new THREE.Mesh(geometry, this.material);
  this.mesh.updateMatrixWorld();
}

FireElement.prototype = Object.create({}, {
  constructor: {
    value: FireElement
  },

  _cornerNeighbors: {
    value: [
      [1, 2, 4],
      [0, 5, 3],
      [0, 3, 6],
      [1, 7, 2],
      [0, 6, 5],
      [1, 4, 7],
      [2, 7, 4],
      [3, 5, 6]
    ]
  },
  _incomingEdges: {
    value: [
      [-1,  2,  4, -1,  1, -1, -1, -1],
      [ 5, -1, -1,  0, -1,  3, -1, -1],
      [ 3, -1, -1,  6, -1, -1,  0, -1],
      [-1,  7,  1, -1, -1, -1, -1,  2],
      [ 6, -1, -1, -1, -1,  0,  5, -1],
      [-1,  4, -1, -1,  7, -1, -1,  1],
      [-1, -1,  7, -1,  2, -1, -1,  4],
      [-1, -1, -1,  5, -1,  6,  3, -1]
    ]
  },

  createMaterial: {
    value: function(vsCode, fsCode){
      let loader = new THREE.TextureLoader();
      let nzw = loader.load('./assets/img/noise.png');
      nzw.wrapS = THREE.RepeatWrapping;
      nzw.wrapT = THREE.RepeatWrapping;
      nzw.magFilter = THREE.LinearFilter;
      nzw.minFilter = THREE.LinearFilter;

      let fireProfile = loader.load('./assets/img/fire.png');
      fireProfile.wrapS = THREE.ClampToEdgeWrapping;
      fireProfile.wrapT = THREE.ClampToEdgeWrapping;
      fireProfile.magFilter = THREE.LinearFilter;
      fireProfile.minFilter = THREE.LinearFilter;

      let material = new THREE.RawShaderMaterial({
        vertexShader: vsCode,
        fragmentShader: fsCode,
        uniforms: {
          time: {
            type: 'f',
            value: 0.0
          },
          nzw: {
            type: 't',
            value: nzw
          },
          fireProfile: {
            type: 't',
            value: fireProfile
          },
          size: {
            type: 'f',
            value: 0.0
          }
        },
        // attributes: {
        //   tex: {
        //     type: 'v3',
        //     value: null
        //   }
        // },

        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        transparent: true

      });

      return material;
    }
  },

  getViewVector: {
    value: function(matrix){
      let elements = matrix.elements;
      return new THREE.Vector3(-elements[2], -elements[6], -elements[10]).normalize();
    }
  },

  update: {
    value: function(deltaTime){
      let matrix = new THREE.Matrix4();
      matrix.multiplyMatrices(this.camera.matrixWorldInverse, this.mesh.matrixWorld);

      // カメラ視点とオブジェクト位置が変化していたらボリュームを更新
      let viewVector = this.getViewVector(matrix);
      if(!this._viewVector.equals(viewVector)){
        this._viewVector = viewVector;
        this.slice();

        // sliceメソッドによって更新された頂点情報をシェーダにアップロード
        this.mesh.geometry.attributes.position.array.set(this._points);
        this.mesh.geometry.attributes.tex.array.set(this._texCoords);
        // this.mesh.geometry.attributes.index.array.set(this._indexes);
        this.mesh.geometry.index.array.set(this._indexes);

        this.mesh.geometry.attributes.position.needsUpdate = true;
        this.mesh.geometry.attributes.tex.needsUpdate = true;
        // this.mesh.geometry.attributes.index.needsUpdate = true;
        this.mesh.geometry.index.needsUpdate = true;
      }

      // 経過時間を更新
      this.mesh.material.uniforms.time.value += deltaTime;
    }
  },

  slice: {
    value: function(){
      this._points = []; // 頂点情報
      this._texCoords = []; // テクスチャ位置情報
      this._indexes = []; // インデックス

      // モデルの角への視線距離？
      let cornerDistance = [];
      cornerDistance[0] = this._posCorners[0].dot(this._viewVector);

      let maxCorner = 0; // 最大距離の頂点インデックス
      let minDistance = cornerDistance[0]; // 最小視線距離
      let maxDistance = cornerDistance[0]; // 最大視線距離

      for(let i = 1; i < 8; i++){
        cornerDistance[i] = this._posCorners[i].dot(this._viewVector);

        if(cornerDistance[i] > maxDistance){
          maxCorner = i;
          maxDistance = cornerDistance[i];
        }
        if(cornerDistance[i] < minDistance){
          minDistance = cornerDistance[i];
        }
      }

      // Aligning slices
      let sliceDistance = Math.floor(maxDistance / this._sliceSpacing) * this._sliceSpacing;

      let activeEdges = [];
      let firstEdge = 0;
      let nextEdge = 0;
      let expirations = new PriorityQueue();

      /**
       * エッジ(辺)生成
       */
      let createEdge = function(startIndex, endIndex){
        // 12が最大値?
        if(nextEdge >= 12){
          return undefined;
        }

        let activeEdge = {
          expired: false,
          startIndex: startIndex,
          endIndex: endIndex,
          deltaPos: new THREE.Vector3(),
          deltaTex: new THREE.Vector3(),
          pos: new THREE.Vector3(),
          tex: new THREE.Vector3()
        };

        // start <-> end間の長さ
        let range = cornerDistance[startIndex] - cornerDistance[endIndex];

        if(range !== 0.0){
          // rangeの逆数
          let irange = 1.0 / range;
          // start <-> end間の差分ベクトル取得。差分ベクトルなので end - start
          // それに逆数をかける
          activeEdge.deltaPos.subVectors(
            this._posCorners[endIndex],
            this._posCorners[startIndex]
          ).multiplyScalar(irange);

          activeEdge.deltaTex.subVectors(
            this._texCorners[endIndex],
            this._texCorners[startIndex]
          ).multiplyScalar(irange);

          let step = cornerDistance[startIndex] - sliceDistance;

          activeEdge.pos.addVectors(
            activeEdge.deltaPos.clone().multiplyScalar(step),
            this._posCorners[startIndex]
          );

          activeEdge.tex.addVectors(
            activeEdge.deltaTex.clone().multiplyScalar(step),
            this._texCorners[startIndex]
          );

          activeEdge.deltaPos.multiplyScalar(this._sliceSpacing);
          activeEdge.deltaTex.multiplyScalar(this._sliceSpacing);
        }

        // 距離がプライオリティとして利用
        expirations.push(activeEdge, cornerDistance[endIndex]);
        activeEdge.cur = nextEdge;
        activeEdges[nextEdge++] = activeEdge;

        return activeEdge;
      };

      // 3辺を接続?(A <-> B <-> C <-> A)
      for(i = 0; i < 3; i++){
        let activeEdge = createEdge.call(this, maxCorner, this._cornerNeighbors[maxCorner][i]);
        activeEdge.prev = (i + 2) % 3;
        activeEdge.next = (i + 1) % 3;
      }

      // sliceDistanceがminDistanceより小さくなるまで繰り返し
      let nextIndex = 0;
      while(sliceDistance > minDistance){
        // 視線距離が大きい方が優先度高?
        while(expirations.top().priority >= sliceDistance){
          let edge = expirations.pop().object;
          if(edge.expired){
            continue;
          }

          let isNotEnd = (edge.endIndex !== activeEdges[edge.prev].endIndex &&
                          edge.endIndex !== activeEdges[edge.next].endIndex);
          if(isNotEnd){
            // split this edge.
            edge.expired = true;

            // create two new edges
            let activeEdge1 = createEdge.call(
              this,
              edge.endIndex,
              this._incomingEdges[edge.endIndex][edge.startIndex]
            );

            activeEdge1.prev = edge.prev;
            activeEdges[edge.prev].next = nextEdge -1;
            activeEdge1.next = nextEdge;

            let activeEdge2 = createEdge.call(
              this,
              edge.endIndex,
              this._incomingEdges[edge.endIndex][activeEdge1.endIndex]
            );
            activeEdge2.prev = nextEdge -2;
            activeEdge2.next = edge.next;
            activeEdges[activeEdge2.next].prev = nextEdge - 1;
            firstEdge = nextEdge - 1;

          }else{
            // merge edge.
            let prev, next;
            if(edge.endIndex === activeEdges[edge.prev].endIndex){
              prev = activeEdges[edge.prev];
              next = edge;
            }else{
              prev = edge;
              next = activeEdges[edge.next];
            }
            prev.expired = true;
            next.expired = true;

            // make new edge
            let activeEdge = createEdge.call(
              this,
              edge.endIndex,
              this._incomingEdges[edge.endIndex][prev.startIndex]
            );
            activeEdge.prev = prev.prev;
            activeEdges[activeEdge.prev].next = nextEdge - 1;
            activeEdge.next = next.next;
            activeEdges[activeEdge.next].prev = nextEdge - 1;
            firstEdge = nextEdge - 1;
          }
        }

        let cur = firstEdge;
        let count = 0;
        do{
          ++count;
          // ループ処理中のアクティブなエッジ
          let activeEdge = activeEdges[cur];

          // 算出した頂点座標
          this._points.push(activeEdge.pos.x);
          this._points.push(activeEdge.pos.y);
          this._points.push(activeEdge.pos.z);

          // 算出したUV座標
          this._texCoords.push(activeEdge.tex.x);
          this._texCoords.push(activeEdge.tex.y);
          this._texCoords.push(activeEdge.tex.z);

          activeEdge.pos.add(activeEdge.deltaPos);
          activeEdge.tex.add(activeEdge.deltaTex);

          cur = activeEdge.next;
        } while(cur !== firstEdge);

        for(i = 2; i < count; i++){
          this._indexes.push(nextIndex);
          this._indexes.push(nextIndex + i - 1);
          this._indexes.push(nextIndex + i + 0);
        }

        nextIndex += count;
        sliceDistance -= this._sliceSpacing;
      }
    }
  }
})