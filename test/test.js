var kefir_child_proc = require('kefir-child-process')
var Kefir = require('kefir')
var _ = require('lodash')
var problems = require('../problemList.js')

function replaceAll(find, replace, str) {
  return str.replace(new RegExp(find, 'g'), replace);
}

// make spaces ok\ for\ cli
function sanitizeSpaces (str) {
  return replaceAll(' ', '\\ ', str)
}

function joinString (s) {
  return s.join('')
}

function falsey (x) {
  if (!x) return x 
}

// returns a stream of solution correctness (booleans)
// side effect - log stacktraces to wrong answers
function testSolution (problem) {

  function selectProblem (problem) {
    return kefir_child_proc.execute('./runner.js select ' + problem)
  }

  function solutionIsCorrect (adventureResponse) {
    return adventureResponse.search('YOUR SOLUTION IS CORRECT') > -1
  }

  function spawnSolution (problem) {
    return kefir_child_proc.spawn(
      './runner.js'
      , ['verify', 'problems/' + problem + '/solution.js'])
  }


  var solutionTries = selectProblem(sanitizeSpaces(problem)).flatMapLatest(function () {
    var executions = spawnSolution(problem)
    var d = executions.debounce(3000)
    return executions.bufferBy(d).map(joinString)
  })
  var solutionCorrectness = solutionTries.map(solutionIsCorrect)
  var wrongAnswers = solutionCorrectness.filter(falsey)
  var wrongAnswerStacktraces = solutionTries.sampledBy(wrongAnswers)
  // side effect - log stacktraces to wrong answers
  wrongAnswerStacktraces.onValue(function (v) {
    console.log('stackTrace for', problem, v)
  })
  // return a stream of solution correctness (booleans)
  return solutionCorrectness
}

function verifyProblems (problems) {
  if (problems.length == 0)
    return
  var p = _.first(problems)
  solutionTries = testSolution(p)
  solutionTries.onValue(function (v) {
    if (v) { console.log(p, 'passes all tests..') }
    else   { console.log('ERR!', p, 'solution.js doesnt work!') }
    verifyProblems(_.rest(problems))
  })  
}

verifyProblems(problems)
