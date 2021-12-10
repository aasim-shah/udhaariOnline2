
const butReq = document.getElementById('bott');
butReq.addEventListener('click', getContactsd);

const cbName = document.getElementById('name');
const cbTel = document.getElementById('tel');


const ulResults = document.getElementById('results');
const preResults = document.getElementById('rawResults');

const supportedd = ('contacts' in navigator && 'ContactsManager' in window);

if (supportedd) {
  const divNotSupported = document.getElementById('notSupported');
  divNotSupported.classList.toggle('hidden', true);
  butReq.removeAttribute('disabled');
  checkProperties();
}

async function checkProperties() {
  const supportedPropertiesd = await navigator.contacts.getProperties();
  if (supportedPropertiesd.includes('name')) {
    enableProp(cbName);
  }

  if (supportedPropertiesd.includes('tel')) {
    enableProp(cbTel);
  }
}

async function getContactsd() {
  const propsd = [];
  if (cbName.checked) propsd.push('name');
  if (cbTel.checked) propsd.push('tel');

  
  try {
    const contactsd = await navigator.contacts.select(propsd);
    handleResults(contactsd);
  } catch (ex) {
    ulResults.classList.toggle('error', true);
    ulResults.classList.toggle('success', false);
    ulResults.innerText = ex.toString();
  }

}

function handleResults(contactsd) {
  ulResults.classList.toggle('success', true);
  ulResults.classList.toggle('error', false);
  ulResults.innerHTML = '';
  renderResults(contactsd);
}

function enableProp(cbox) {
  cbox.removeAttribute('disabled');
  cbox.setAttribute('checked', 'checked');
}

function renderResults(contactsd) {
  contactsd.forEach((contact) => {
    if (contact.name) {document.getElementById('referrence2_name').setAttribute('value', contact.name)};
    if (contact.tel){document.getElementById('referrence2_contact').setAttribute('value',contact.tel)};
  });
  const strContacts = JSON.stringify(contactsd, null, 2);
  console.log(strContacts);
}

