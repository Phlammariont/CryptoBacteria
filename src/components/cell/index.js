import React, {useEffect, useState} from 'react'
import {map, prop, remove} from 'ramda'
import { interval, Subject } from 'rxjs'
import { switchMap, takeUntil, map as map$ } from 'rxjs/operators'
import Graph from '../Graph'

const start = new Subject();
const stop = new Subject();
const end = new Subject();

let state = {
  food: 1000,
  genLevel: 0,
  cells: [{}],
  historic: [],
}

const timeLine$ = start.pipe(
  switchMap(period => interval(period).pipe(takeUntil(stop))),
  map$(value => state),
  takeUntil(end)
)

timeLine$.subscribe((value) => {
  state = calculateNextGen(state)
  console.log('🥦🥦🥦🥦🥦🥦🥦🥦🥦🥦🥦', value, state)
}, console.log,console.log)

const calculateNextGen = (state) => ({
  ...newGen(state),
  historic: [...state.historic, state.cells.length],
  genLevel: ++state.genLevel,
})

//CONSTANTS:
const ORIGINAL_CELL_CONSUMPTION = 0.2
let CELL_CONSUMPTION = 0.2
const BACTERIA_TO_FOOD = 0.05 // number of bacterias that a dying bacteria can feed

//Selectors:
const getFood = prop('food')
const currentPopulation = (state) => state.cells.length
const getReproductive = cells => Math.ceil(Math.random() * cells)

const calculateRequiredFood = cellsNumber => {
  const eatingCells = Math.ceil((0.5 + 0.5 * Math.random()) * cellsNumber)
  return eatingCells * CELL_CONSUMPTION
}

const calculateReproductiveFood = ({currentGeneration, reproductiveCells, food}) => {
  const requiredFood = calculateRequiredFood(currentGeneration)
  const missingFood = requiredFood > food ? requiredFood - food : 0
  const isMissingFood = missingFood > 0
  const bacteriaMissingFood = Math.ceil(missingFood / CELL_CONSUMPTION)
  const reproductiveAbleCells = isMissingFood ? reproductiveCells - bacteriaMissingFood : currentGeneration
  const remainingFood = isMissingFood ? 0 : food - requiredFood
  const hasEnoughFoodForNextGen = (currentGeneration + Math.abs(reproductiveAbleCells)  ) * ORIGINAL_CELL_CONSUMPTION < remainingFood
  const nexGenMultiplier = hasEnoughFoodForNextGen ? 1 : Math.random()
  //if (hasEnoughFoodForNextGen) CELL_CONSUMPTION = ORIGINAL_CELL_CONSUMPTION
  if(!hasEnoughFoodForNextGen && ORIGINAL_CELL_CONSUMPTION === CELL_CONSUMPTION) CELL_CONSUMPTION = CELL_CONSUMPTION / 1.5
  const nurturedReproductiveCell = reproductiveAbleCells > 0 ? Math.ceil(reproductiveAbleCells * nexGenMultiplier * nexGenMultiplier) : 0

  return {
    bacteriaMissingFood,
    isMissingFood,
    nurturedReproductiveCell,
    remainingFood,
  }
}

const newGen = state => {
  const food = getFood(state)
  const currentGeneration = currentPopulation(state)
  const reproductiveCells = getReproductive(currentGeneration)
  const { nurturedReproductiveCell, isMissingFood, remainingFood, bacteriaMissingFood} = calculateReproductiveFood({currentGeneration, reproductiveCells, food})
  const newGeneration = Array(nurturedReproductiveCell).fill({genLevel: state.genLevel + 1})
  if ( isMissingFood ) return {
    isMissingFood,
    cells: [...removeCells(state.cells, bacteriaMissingFood), ...newGeneration],
    food: bacteriaMissingFood * CELL_CONSUMPTION * BACTERIA_TO_FOOD,
  }
  return {
    isMissingFood,
    cells: [...state.cells, ...newGeneration],
    food: remainingFood
  }
}

const removeCells = (cells, number) => {
  if (number < 1) return cells
  return remove(cells.length - number, number, cells)
}

const sellBacteria = (number) => {
  if (state.cells.length < number) return false
  state = {...state, cells: removeCells(state.cells, number)}
  return true
}

const addFood = (number) => {
  state = { ...state, food: state.food + number }
  return true
}



const Cell = () => {
  const [scale, setScale] = useState(100)
  const [maxNumber, setMaxNumber] = useState(0)
  const [money, setMoney] = useState(0)
  const [state, setState] = useState({cells: [{}]})

  const updateState = state => {
    if (state.cells.length > maxNumber) setMaxNumber(state.cells.length)
    setState(state)
  }
  const sell = () => {
    if (sellBacteria(100))setMoney(money + 100)
  }

  const buy = () => {
    if (money < 100) return false
    addFood(1000)
    setMoney(money - 100)
  }

  useEffect( () => {
    timeLine$.subscribe(updateState, console.log, console.log)
    start.next(10000)
  }, [])

  const scaleTime = ({target:{value}}) => {
    stop.next(value)
    setScale(value)
    start.next(10 + (990/50) * value)
  }
  return (
    <>
      <header className="App-header" style={{flexGrow: 2, flexBasis: 100}}>
        FOOD: {state.food} - POPULATION: {state.cells.length} - Max Bacteria: {maxNumber} - money: {money} - Gen: {state.genLevel}
        <input type="range" min="0" max="100" value={scale} className="slider" id="myRange" onChange={scaleTime}/>
        <button onClick={() => end.next()}>END GAME</button>
        { state.cells.length > 100 && <button onClick={sell}>Sell Some Bacteria</button> }
        { money > 100 && <button onClick={buy}>Buy Some Food</button> }
      </header>
      <main style={{display: 'flex'}}>
        <div className='game-container'>
          <svg>
            {map(OneCell, state.cells)}
          </svg>

        </div>
        <Graph historic={state.historic}/>
      </main>
    </>
  )
}

const OneCell = (cell) => <circle cx={Math.random() * 1000} cy={Math.random() * 500} r={25 + Math.random() * 25} stroke="green" strokeWidth="4" fill={`#${cell.genLevel}`} />


export default Cell