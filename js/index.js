let sw = 20, // 一个小方格的宽
  sh = 20, // 一个小方格的高
  td = 30, // 整个地图的列数
  tr = 30 // 整个地图的行数

let snake = null, // 蛇的实例
  food = null, // 食物的实例
  game = null // 游戏的实例

const SPEED = 200

// 方块的构造方法
function Square(x, y, classN) {
  this.x = x * sw // 方块实际X的位置
  this.y = y * sh // 方块实际Y的位置
  this.class = classN // 方块的样式[snake-head，snake-body，food]
  this.viewContent = document.createElement('div') // 方块的本体
  this.viewContent.className = this.class
  this.parent = document.getElementById('snake-wrap') // 方块的父级DOM元素
}

// 创建方块
Square.prototype.create = function() {
  this.viewContent.style.position = 'absolute'
  this.viewContent.style.left = this.x + 'px' // 方块X位置
  this.viewContent.style.top = this.y + 'px' // 方块Y位置
  this.viewContent.style.width = sw + 'px' // 方块的宽
  this.viewContent.style.height = sh + 'px' // 方块的高
  this.parent.appendChild(this.viewContent) // 将方块添加到父级DOM元素
}

// 移除方块
Square.prototype.remove = function() {
  this.parent.removeChild(this.viewContent) // 将方块移除出父级DOM元素
}

// 蛇的构造方法
function Snake() {
  this.head = null // 蛇头
  this.tail = null // 蛇尾
  this.pos = [] // 蛇所有组成方块的位置，是一个二维数组
  this.directionNum = {
    // 蛇的方向
    left: {
      x: -1,
      y: 0,
      rotate: 180 // 蛇头的旋转方向
    },
    right: {
      x: 1,
      y: 0,
      rotate: 0
    },
    up: {
      x: 0,
      y: -1,
      rotate: -90
    },
    down: {
      x: 0,
      y: 1,
      rotate: 90
    }
  }
}

//初始化蛇
Snake.prototype.init = function() {
  // 创建蛇头
  let snakeHead = new Square(2, 0, 'snake-head')
  this.head = snakeHead // 存入蛇头信息
  this.pos.push([2, 0]) // 记录位置
  snakeHead.create()

  // 创建蛇身体1
  let snakeBody1 = new Square(1, 0, 'snake-body')
  this.pos.push([1, 0])
  snakeBody1.create()

  // 创建蛇身体2
  let snakeBody2 = new Square(0, 0, 'snake-body')
  this.tail = snakeBody2 // 存入蛇尾信息
  this.pos.push([0, 0])
  snakeBody2.create()

  // 建立方块之间的链表关系，以让蛇形成一个整体
  // 蛇头的指向
  snakeHead.last = null
  snakeHead.next = snakeBody1
  // 蛇身体的指向
  snakeBody1.last = snakeHead
  snakeBody1.next = snakeBody2
  // 蛇尾的指向
  snakeBody2.last = snakeBody1
  snakeBody2.next = null

  // 蛇的方向的属性
  this.direction = this.directionNum.right // 初始蛇向右
}

// 判断蛇的下一步需要处理事件
Snake.prototype.getNextPos = function() {
  // 下一步的位置
  let nextPos = [
    // 因为前面head的x、y是实际的位置，所以需要换算回系数，再加上方向参数，即可以得知是往那边走
    this.head.x / sw + this.direction.x,
    this.head.y / sh + this.direction.y
  ]
  // 判断下一个点是自己，游戏结束
  let isSelfEat = false
  this.pos.forEach(value => {
    // 因为数组是引用数据类型，所以不能直接判断，要单独拿出来判断
    if (value[0] == nextPos[0] && value[1] == nextPos[1]) {
      // 判断两个位置是否相等，相等为自己碰到了自己
      isSelfEat = true
    }
  })
  if (isSelfEat) {
    this.strategies.die.call(this)
    return
  }
  // 判断下一个点是围墙，游戏结束
  if (
    nextPos[0] < 0 ||
    nextPos[1] < 0 ||
    nextPos[0] > td - 1 ||
    nextPos[1] > tr - 1
  ) {
    this.strategies.die.call(this)
    return
  }
  // 判断下一个点是食物，吃掉食物，自己身体增加一个
  if (food && food.pos[0] == nextPos[0] && food.pos[1] == nextPos[1]) {
    // 判断食物是否存在，食物的坐标和蛇头下一个点的坐标是否一样
    this.strategies.eat.call(this)
    return
  }
  // 如不为上面的这几种情况，继续走
  // 这里用call是为了改变this执行，原本是指向调用这个函数的strategies，我们需要指向snake
  this.strategies.move.call(this)
}

// 碰撞后发生的事件
Snake.prototype.strategies = {
  // 移动的时候，先创建一个新的身体，然后把蛇头删除，把新的身体放到原本蛇头的位置，然后在创建一个新蛇头，放到nextPos的位置,然后在把尾巴删除，当吃到食物的时候，就不把尾巴删除，就等于增加了身体
  move(isEat) {
    // 当传了isEat就代表吃到食物了
    // 创建新身体
    let newBody = new Square(this.head.x / sw, this.head.y / sh, 'snake-body')
    // 更新链表关系
    newBody.next = this.head.next // head的next就是body1
    newBody.next.last = newBody // 将body1的last更新为newBody
    newBody.last = null // 因为newBody现在是在旧head的位置，所以前面没东西

    this.head.remove() // 移除旧head
    newBody.create()

    // 创建新蛇头
    let newHead = new Square(
      this.head.x / sw + this.direction.x,
      this.head.y / sh + this.direction.y,
      'snake-head'
    )
    // 更新链表关系
    newHead.next = newBody
    newHead.last = null
    newBody.last = newHead

    // 更新位置数组,因为新身体的位置其实就是旧蛇头的位置，所以只需要把新蛇头的位置加到数组的最顶端就可以了
    this.pos.unshift([
      this.head.x / sw + this.direction.x,
      this.head.y / sh + this.direction.y
    ])
    // 更新head的信息
    this.head = newHead

    // 蛇头旋转的角度
    newHead.viewContent.style.transform =
      'rotate(' + this.direction.rotate + 'deg)'

    newHead.create()

    // 判断是否有吃到食物,吃到食物isEat为true,那就不会执行下面的语句
    // 当没吃食物的时候，就是没传isEat进来，也就是undefined，取反就是true就会删除尾巴
    if (!isEat) {
      this.tail.remove() // 移除尾巴
      // 更新链表
      this.tail = this.tail.last
      this.tail.next = null
      // 移除位置数组的最后一个
      this.pos.pop()
    }
  },
  eat() {
    this.strategies.move.call(this, true) // 传个true过去
    createFood()
    game.score++
  },
  die() {
    game.gameOver()
  }
}
snake = new Snake()

// 创建食物
function createFood() {
  let x = null,
    y = null,
    isInclude = true // 当isInclude为true的时候代表食物生成到snake的身上了（继续循环），false是为不在了（跳出循环）

  while (isInclude) {
    // 生成一个0-29的随机数,先要减1再乘随机数，不然会出现负数（0.00001*30 - 1）
    x = Math.round(Math.random() * (td - 1))
    y = Math.round(Math.random() * (tr - 1))

    // 循环判断蛇的位置数组和食物是否重叠
    snake.pos.forEach(value => {
      if (value[0] != x && value[1] != y) {
        isInclude = false // 当不重叠的时候，跳出循环
      }
    })
  }
  food = new Square(x, y, 'food')
  food.pos = [x, y] // 食物的坐标，用于和蛇头坐标对比

  // 获取食物的DOM节点
  let foodDom = document.getElementsByClassName('food')[0]
  // 判断如果有食物，那就改变食物的坐标，如果没有就创建

  if (foodDom) {
    foodDom.style.left = x * sw + 'px'
    foodDom.style.top = y * sh + 'px'
  } else {
    food.create()
  }
}

// 创建游戏的控制逻辑
function Game() {
  this.timer = null
  this.score = 0
}
Game.prototype.init = function() {
  snake.init()
  createFood()

  // 监听键盘控制蛇的方向
  document.addEventListener('keydown', ev => {
    // 判断当蛇正在往右走的时候，往左走无效,其他同理
    if (ev.which == 37 && snake.direction != snake.directionNum.right) {
      snake.direction = snake.directionNum.left
    } else if (ev.which == 38 && snake.direction != snake.directionNum.down) {
      snake.direction = snake.directionNum.up
    } else if (ev.which == 39 && snake.direction != snake.directionNum.left) {
      snake.direction = snake.directionNum.right
    } else if (ev.which == 40 && snake.direction != snake.directionNum.up) {
      snake.direction = snake.directionNum.down
    }
  })
  this.start()
}
// 开始游戏
Game.prototype.start = function() {
  this.timer = setInterval(() => {
    snake.getNextPos()
  }, SPEED)
}

// 暂停游戏
Game.prototype.pauseGame = function() {
  clearInterval(this.timer)
}

// 游戏结束
Game.prototype.gameOver = function() {
  clearInterval(this.timer)

  // 游戏结算页面
  let mask = document.getElementsByClassName('mask')[0],
    msg = document.getElementsByClassName('alert-msg')[0],
    finishBtn = document.querySelector('.mask .alert-box button')
  mask.style.display = 'block'
  msg.innerHTML = '您的得分为：' + this.score + '分'

  // 监听结算页面按钮
  finishBtn.addEventListener(
    'click',
    function() {
      mask.style.display = 'none'
    },
    false
  )
  // 按下回车时，也可以清除遮罩
  document.addEventListener(
    'keydown',
    function(ev) {
      if (ev.which == 13) {
        mask.style.display = 'none'
      }
    },
    false
  )

  // 重置游戏布局
  let snakeWrap = document.getElementById('snake-wrap'),
    startBtn = document.getElementsByClassName('start-btn')[0]
  snakeWrap.innerHTML = '' // 将蛇和食物的DOM元素清除
  snake = new Snake() // 建个新的对象覆盖以前的
  game = new Game()
  startBtn.style.display = 'block'
}

game = new Game()

// 开启游戏按钮
let startBtn = document.querySelector('.start-btn button')
startBtn.addEventListener(
  'click',
  function() {
    startBtn.parentNode.style.display = 'none'
    game.init()
  },
  false
)

// 点击snakeWrap暂停游戏
let snakeWrap = document.getElementById('snake-wrap'),
  pauseBtn = document.getElementsByClassName('pause-btn')[0]
snakeWrap.addEventListener(
  'click',
  function() {
    game.pauseGame() // 暂停游戏
    pauseBtn.style.display = 'block' // 显示恢复按钮
  },
  false
)

// 恢复游戏按钮
pauseBtn.addEventListener(
  'click',
  function() {
    pauseBtn.style.display = 'none' // 隐藏恢复按钮
    game.start() // 开始游戏
  },
  false
)
