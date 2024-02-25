import '../css/style.css'
import Pocketbase from 'pocketbase'

const selectedTags = []

// DOM elements

const $addGender = document.getElementById('add-song__gender')
const $addRithm = document.getElementById('add-song__rithm')
const $addTags = document.getElementById('add-song__tags')
const $addSong = document.getElementById('add-song')
const $addTagBtn = document.getElementById('add-tag-btn')
const $createSongBtn = document.getElementById('create-song-btn')
const $titleSongInput = document.getElementById('add-song__title')

// Variables de entorno

const viteEnv = import.meta.env
const URL = viteEnv.VITE_PB_URL
const ADMIN = viteEnv.VITE_PB_ADMIN
const ADMIN_PASS = viteEnv.VITE_PB_ADMIN_PASS

// Instanciar PocketBase

const pb = new Pocketbase(URL)

// Admin auth

// eslint-disable-next-line no-unused-vars
const authData = await pb.admins.authWithPassword(
  ADMIN,
  ADMIN_PASS
)

// get records

const genderRecords = await pb.collection('gender').getFullList()
const genderRithmRecords = await pb.collection('gender_rithm').getFullList(
  {
    expand: 'genderID, rithmID'
  }
)
const tagRecords = await pb.collection('tag').getFullList()

console.log(genderRithmRecords[0].expand.genderID.name)

// Create Elements

const create$SelectedTag = (v) => {
  const $tag = document.createElement('DIV')
  const $close = document.createElement('SPAN')
  $tag.textContent = v
  $close.classList.add('close-tag')
  $tag.append($close)
  return $tag
}

const create$Option = (name) => {
  const $option = document.createElement('OPTION')
  $option.textContent = name
  return $option
}

const create$RithmOption = (genderRithm) => {
  const $option = document.createElement('OPTION')
  $option.textContent = genderRithm.expand.rithmID.name
  return $option
}

// Render Functions

const renderAllRecords = (elm, recordList) => {
  const fragment = document.createDocumentFragment()
  recordList.forEach(({ name }) => {
    const $option = create$Option(name)
    fragment.append($option)
  })
  elm.append(fragment)
}

const renderRithmsByGender = ($select, gender, genderRithms) => {
  const fragment = document.createDocumentFragment()
  const filterRithmGenders = genderRithms.filter(({ expand }) => expand.genderID.name === gender)
  filterRithmGenders.forEach(rithmGender => {
    const $rithmOption = create$RithmOption(rithmGender)
    fragment.append($rithmOption)
  })
  $select.append(fragment)
}

const renderSelectedTags = ($parent, $select) => {
  const v = $select.value
  if (v !== '-') {
    const $selectedTags = document.createElement('DIV')
    const $tag = create$SelectedTag(v)
    $selectedTags.append($tag)
    $parent.append($selectedTags)
    selectedTags.push(v)
    const $optionToRemove = Array.from($select.children).find($option => $option.textContent === v)
    $select.removeChild($optionToRemove)
  }
}

// Render

$addGender.addEventListener('change', e => {
  Array.from($addRithm.children).forEach(child => child.value === child.textContent && child.remove())
  const gender = e.target.value
  renderRithmsByGender($addRithm, gender, genderRithmRecords)
})

$addTagBtn.addEventListener('click', (e) => {
  e.preventDefault()
  renderSelectedTags($addSong, $addTags)
})

renderAllRecords($addGender, genderRecords)
renderAllRecords($addTags, tagRecords)

// Delete

const deleteSelectTag = (e, $select) => {
  if (e.target.nodeName === 'SPAN') {
    const v = e.target.parentElement.textContent
    const $option = create$Option(v)
    e.target.parentElement.remove()
    $select.append($option)
    const indexToDelete = selectedTags.findIndex(tag => tag === v)
    delete (selectedTags[indexToDelete])
  }
}

$addSong.addEventListener('click', (e) => deleteSelectTag(e, $addTags))

// Send Data

const createSong = ($title, $gender, $rithm, tags) => {
  const genderRithmID = genderRithmRecords.find(({ expand }) => expand.genderID.name === $gender.value && expand.rithmID.name === $rithm.value).id
  const filterTags = tags.filter(tag => tag !== '')
  const idTags = filterTags.map(tag => tagRecords.find(rec => rec.name === tag).id)
  const song = {
    title: $title.value,
    gender_rithm_ID: genderRithmID,
    tags: idTags
  }
  return song
}

// create record

$createSongBtn.addEventListener('click', async (e) => {
  e.preventDefault()
  const song = createSong($titleSongInput, $addGender, $addRithm, selectedTags)
  // eslint-disable-next-line no-unused-vars
  const record = await pb.collection('song').create(song)
  console.log(song)
})
