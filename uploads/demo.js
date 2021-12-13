
const butReq = document.getElementById('butRequest');
butReq.addEventListener('click', getContacts);



const butReqd = document.getElementById('bott');
butReqd.addEventListener('click', getContactsd);



const butReq3 = document.getElementById('bott3');
butReq3.addEventListener('click', getContacts3);

const cbName = document.getElementById('name');
const cbTel = document.getElementById('tel');


const ulResults = document.getElementById('results');
const preResults = document.getElementById('rawResults');

const supported = ('contacts' in navigator && 'ContactsManager' in window);

if (supported) {
  const divNotSupported = document.getElementById('notSupported');
  divNotSupported.classList.toggle('hidden', true);
  butReq.removeAttribute('disabled');
    butReqd.removeAttribute('disabled');

  checkProperties();
}

async function checkProperties() {
  const supportedProperties = await navigator.contacts.getProperties();
  if (supportedProperties.includes('name')) {
    enableProp(cbName);
  }

  if (supportedProperties.includes('tel')) {
    enableProp(cbTel);
  }
}

async function getContacts() {
  const props = [];
  if (cbName.checked) props.push('name');
  if (cbTel.checked) props.push('tel');

  
  try {
    const contacts = await navigator.contacts.select(props);
    handleResults(contacts);
  } catch (ex) {
    ulResults.classList.toggle('error', true);
    ulResults.classList.toggle('success', false);
    ulResults.innerText = ex.toString();
  }

}





async function getContactsd() {
  const props = [];
  if (cbName.checked) props.push('name');
  if (cbTel.checked) props.push('tel');

  
  try {
    const contacts = await navigator.contacts.select(props);
    handleResultsd(contacts);
  } catch (ex) {
    ulResults.classList.toggle('error', true);
    ulResults.classList.toggle('success', false);
    ulResults.innerText = ex.toString();
  }

}

function handleResultsd(contacts) {
  ulResults.classList.toggle('success', true);
  ulResults.classList.toggle('error', false);
  ulResults.innerHTML = '';
  renderResultsd(contacts);
}

function enablePropd(cbox) {
  cbox.removeAttribute('disabled');
  cbox.setAttribute('checked', 'checked');
}

function renderResultsd(contacts) {
  contacts.forEach((contact) => {
    if (contact.name) {document.getElementById('referrence2_name').setAttribute('value', contact.name)};
    if (contact.tel){document.getElementById('referrence2_contact').setAttribute('value',contact.tel)};
  });
  const strContacts = JSON.stringify(contacts, null, 2);
  console.log(strContacts);
}








function handleResults(contacts) {
  ulResults.classList.toggle('success', true);
  ulResults.classList.toggle('error', false);
  ulResults.innerHTML = '';
  renderResults(contacts);
}

function enableProp(cbox) {
  cbox.removeAttribute('disabled');
  cbox.setAttribute('checked', 'checked');
}

function renderResults(contacts) {
  contacts.forEach((contact) => {
    if (contact.name) {document.getElementById('referrence1_name').setAttribute('value', contact.name)};
    if (contact.tel){document.getElementById('referrence1_contact').setAttribute('value',contact.tel)};
  });
  const strContacts = JSON.stringify(contacts, null, 2);
  console.log(strContacts);
}

