import Head from 'next/head'
import Image from 'next/image'
import { Inter } from 'next/font/google'
import styles from '@/styles/Home.module.css'
import { useState, useRef, useEffect } from 'react'
import { render } from 'react-dom'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const navLinkClassName = "text-xl text-white mb-4 mx-4 flex-1 font-mono font-light tracking-widest"
  const buttonClassName = "bg-red-500 px-8 py-4 rounded-xl "
  const buttonActivatedClassName = buttonClassName + "bg-green-500"
  const buttonDeactivatedClassName = buttonClassName + "bg-gray-500 pointer-events-none"
  const [navOpen, setNavOpen] = useState(false)
  const [inputNum, setInputNum] = useState(0)
  const [sequenceNum, setSequenceNum] = useState(0)
  const [outputNum, setOutputNum] = useState(0)
  const [screenState, setScreenState] = useState(null)
  const [isSelecting, setIsSelecting] = useState(false)

  const [inpToSeq, setInpToSeq] = useState([])
  const [seqToOut, setSeqToOut] = useState([])

  const [connections, setConnections] = useState(new Array())
  
  const inputRefs = useRef(new Array())
  const sequenceRefs = useRef(new Array())
  const outputRefs = useRef(new Array())

  const [selected, setSelected] = useState(null)

  const resetNums = () => {
    setInputNum(0)
    setSequenceNum(0)
    setOutputNum(0)
    setInpToSeq([])
    setSeqToOut([])
  }

  const renderConnections = () => {
    var tmpConnections = new Array()
    inpToSeq.map((inp, iInp) => {
      inp.map((isConnection, iSeq) => {
        if (isConnection) {
          tmpConnections.push(getPos(inputRefs.current[iInp], sequenceRefs.current[iSeq]))
        }
      })
    })

    seqToOut.map((seq, iSeq) => {
      seq.map((isConnection, iOut) => {
        if (isConnection) {
          tmpConnections.push(getPos(sequenceRefs.current[iSeq], outputRefs.current[iOut]))
        }
      })
    })
    setConnections(tmpConnections)
  }

  const getPos = (leftRef, rightRef) => {
    if (!leftRef || !rightRef) return
    const left = leftRef.getBoundingClientRect()
    const right = rightRef.getBoundingClientRect()
    const r = {
      x1: left.x + left.width, 
      y1: left.y + left.height / 2, 
      x2: right.x, 
      y2: right.y + right.height / 2, 
      dx: Math.abs(right.x - (left.x + left.width)), 
      dy: Math.abs(right.y + right.height / 2 - (left.y + left.height / 2)), 
    }
    return r
  }

  const toggleNav = () => {
    setNavOpen(!navOpen)
  }

  useEffect(() => {
    setScreenState(screen)
  },[])
  
  const renderSvg = () => {
    if (!screenState) return null
    
    return <svg
    viewBox={'0 0 ' + screen.width + ' ' + screen.height}
    className="absolute top-0 left-0 pointer-events-none"
  >
  {connections.map((pos, posIndex) => {
    if (!pos) return
    return (
    <path 
      key={posIndex}
      d={createD(pos)}
      fill="none"
      stroke={'#FF0000'}
      strokeWidth={5}
    />)})}
  </svg>
  }

  useEffect(() => {renderConnections()}, [inpToSeq, seqToOut, inputRefs, sequenceRefs, outputRefs])
  
  const offset = 0.25
  const createD = ({x1, y1, x2, y2, dx, dy}) => {
    return 'M ' + x1 + ','  + y1 + 
    ' C ' + (x2 - dx * offset)  + ',' + y1 + ' ' + 
     (x1 + dx * offset) + ',' + y2 + ' ' + 
    x2 + ',' + y2
  }

  const handleClick = (buttonRef) => {
    let selecting = !isSelecting
    setIsSelecting(selecting)
    if (selecting) {
      setSelected(buttonRef)
      let [allowedRefs, nonAllowedRefs] = getAllowedConnections(buttonRef)

      allowedRefs.forEach(ref => {
        ref.className = buttonActivatedClassName
      });
      nonAllowedRefs.forEach(ref => {
        ref.className = buttonDeactivatedClassName
        ref.onClick = () => {}
      });
      buttonRef.className = buttonClassName
    } else {
      let allRefs = inputRefs.current.concat(sequenceRefs.current).concat(outputRefs.current) 
      allRefs.forEach(ref => {
        if (ref) {
          ref.className = buttonClassName
        }
      });
      if (selected) {
        if (selected != buttonRef) {
          let indexFrom = 0;
          let indexTo = 0;
          let conns = [...inpToSeq]
          console.log(conns)
          conns[indexFrom][indexTo] = 1
          console.log(conns)
          setInpToSeq(conns)
        }
      }
    }
  }

  const getAllowedConnections = (buttonRef) => {
    if (!buttonRef) {
      return [], inputRefs.current.concat(sequenceRefs.current).concat(outputRefs.current) 
    }
    let allowed = []
    if (isRefType(buttonRef, inputRefs.current)) {
      // TODO
      allowed = sequenceRefs.current ? sequenceRefs.current : []
    } else if (isRefType(buttonRef, sequenceRefs.current)) {
      // TODO
      allowed = outputRefs.current ? outputRefs.current : []
    } else if  (isRefType(buttonRef, outputRefs.current)) {
      // TODO
    }
    return [allowed, getNonAllowedRefs(buttonRef, allowed)]
  }

  const getNonAllowedRefs = (buttonRef, allowedRefs) => {
    let allRefs = inputRefs.current.concat(sequenceRefs.current).concat(outputRefs.current) 
    let nonAllowed = []
    for (let i = 0; i < allRefs.length; i++) {
      let ref = allRefs[i]
      if (!ref) {
        continue
      }
      if ((ref!=buttonRef) && !(isRefType(ref, allowedRefs)))  {
        nonAllowed.push(ref)
      }
    }
    return nonAllowed
  }

  const isRefType = (ref, refArray) => {
    return refArray.includes(ref)
  }

  const updateButtons = (column, add, index=-1) => {
    const delta = add ? 1 : -1
    if (column == 'i') {
      setInputNum(inputNum + delta)
    }
    else if (column == 's') {
      setSequenceNum(sequenceNum + delta)
    }
    else if (column == 'o') {
      setOutputNum(outputNum + delta)
    }

    if (add) {
      let tmpIS = [...inpToSeq]
      let tmpSO = [...seqToOut]
      if (index != -1) return

      if (column == 'i') {
        const l = new Array(sequenceNum).fill(0)
        tmpIS.push(l)
        setInpToSeq(tmpIS)
      }
      else if (column == 's') {
        for (let i = 0; i < inpToSeq.length; i++) {
          tmpIS[i].push(0)
        }
        const l = new Array(outputNum).fill(0)
        tmpSO.push(l)
        setInpToSeq(tmpIS)
        setSeqToOut(tmpSO)
      }
      else if (column =='o') {
        if (sequenceNum == 0) {
          tmpSO.push([])
        }
        for (let i = 0; i < sequenceNum; i++) {
          tmpSO[i].push(0)
        }
        setSeqToOut(tmpSO)
      }
    } else {
      // TODO
    }
  }

  return (
    <>
      <Head>
        <title>Din mamma lol</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {renderSvg()}
      <main className='bg-blue-500 min-h-screen h-full z-10'>
          <button onClick={toggleNav} className="z-10 aspect-square top-2 left-2 text-center w-12 bg-white fixed rounded-xl text-3xl">{navOpen ? "⧥" : "≡"}</button>
          <aside className={navOpen ? "border-2 transistion-all duration-500 fixed h-screen bg-red-300" : "h-screen fixed transition-all -translate-x-full border-2 duration-500"}>
            <nav className="mx-8 pt-32 flex flex-col h-full justify-between transition-all duration-500 delay-300 ">
              <p className={navLinkClassName}>Mannen</p>
              <p className={navLinkClassName}>Jag</p>
              <p className={navLinkClassName}>Hatar</p>
              <p className={navLinkClassName}>Next</p>
              <p className={navLinkClassName}>Hydration</p>
            </nav>
          </aside>
          <buttton className="bg-red-400 fixed top-4 right-4 p-8 rounded-xl" onClick={resetNums}>
            R
          </buttton>
          <div className="">
              <h1 className='text-white font-mono text-7xl text-center'>Hello everybody</h1>
              <div className="mx-auto grid grid-cols-3 gap-8 px-36 gap-x-20 my-20 text-7xl">
              <div id="input" className="flex flex-col gap-8 items-stretch">
                <button className="bg-zinc-400 rounded-xl text-white" onClick={() => updateButtons('i', true)}>+</button>
                {Array.from(Array(inputNum).keys()).map((index) => (
                  <button key={index} ref={(element) => inputRefs.current[index] = element} onClick={() => handleClick(inputRefs.current[index])} className={buttonClassName}>
                    {index}
                  </button>
                  ))}
              </div>
              <div id="sequence" className="flex flex-col gap-8 items-stretch">
                <button className="bg-zinc-400 rounded-xl text-white" onClick={() => updateButtons('s', true)}>+</button>
                {Array.from(Array(sequenceNum).keys()).map((index) => (
                  <button key={index} ref={(element) => sequenceRefs.current[index] = element} onClick={() => handleClick(sequenceRefs.current[index])} className={buttonClassName}>
                    {index + 'a'}
                  </button>
                  ))}
              </div>
              <div id="output" className="flex flex-col gap-8 items-stretch">
                <button className="bg-zinc-400 rounded-xl text-white" onClick={() => updateButtons('o', true)}>+</button>
                {Array.from(Array(outputNum).keys()).map((index) => (
                  <button key={index} ref={(element) => outputRefs.current[index] = element} onClick={() => handleClick(outputRefs.current[index])} className={buttonClassName}>
                    {index + 'b'}
                  </button>
                  ))}
              </div>
              </div>
          </div>
      </main>
    </>
  )
}
