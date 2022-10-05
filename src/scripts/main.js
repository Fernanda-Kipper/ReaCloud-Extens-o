const button = document.getElementById('button')
const paragraph = document.getElementById('paragraph')
const input = document.getElementById('title-input')
const label = document.getElementById('label')
let signal_popup = document.getElementById("verified_img")
let currentUrl = ''
let currentSrc = ''

function afterExclusionMode(){
    button.removeAttribute('class')
    button.removeEventListener('click', exclude)
    button.style = "display: none;"
    paragraph.textContent = "ATENÇÃO! Se deseja salvar novamente esse link novamente, feche e abra a janela da extensão"
}

function exclude(){
    chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
        let currentUrl = tabs[0].url
        chrome.storage.sync.get(['resources'], function(result) {
            const newResourceList = result.resources.filter(resource => resource.link != currentUrl)
            chrome.storage.sync.set({'resources': newResourceList}, function() {
                afterExclusionMode()
            })
        })
    })
}

function deleteButtonMode(){
    button.textContent = 'Excluir Link'
    button.setAttribute('class', 'delete')
    button.addEventListener('click', exclude)
    input.style = 'display: none;'
    label.style = 'display: none;'
}

function saveUnsupported(){
    chrome.storage.sync.get(['resources'], function(result) {
        let newResource = {link: currentUrl, title: input.value}
        if(result.resources && result.resources.length > 0){
            chrome.storage.sync.set({'resources': [...result.resources, newResource]}, function() {
                paragraph.textContent = 'Salvo com sucesso'
                deleteButtonMode()
            })
        }else{
            chrome.storage.sync.set({'resources': [newResource]}, function() {
                paragraph.textContent = 'Salvo com sucesso'
                deleteButtonMode()
            })
        }
    })
}

function saveYoutube(){
    chrome.storage.sync.get(['resources'], function(storage) {
        if(currentUrl.includes("www.youtube.com/watch?v=")){ // Youtube Video Case
            let video_id = currentUrl.split('v=')[1];
            let endPosition = video_id.indexOf('&');
            if(endPosition != -1) 
            video_id = video_id.substring(0, endPosition);

            fetch("https://youtube.googleapis.com/youtube/v3/videos?part=snippet&id=" + video_id + "&key=AIzaSyCOKOSVWLbAmThCnn4L4W3AjpPhOUDMQHk")
            .then((data) => {
                return data.json()
            })
            .then((result) => {
                let newResource = {
                    link: currentUrl,
                    title: input.value,
                    videoTitle: result.items[0].snippet.title,
                    channel: result.items[0].snippet.channelTitle,
                    description: result.items[0].snippet.description
                }
                return newResource;
            })
            .then((newResource) => {
                if(storage.resources && storage.resources.length > 0){
                    chrome.storage.sync.set({'resources': [...storage.resources, newResource]}, function() {
                        paragraph.textContent = 'Salvo com sucesso'
                        deleteButtonMode()
                    })
                }else{
                    chrome.storage.sync.set({'resources': [newResource]}, function() {
                        paragraph.textContent = 'Salvo com sucesso'
                        deleteButtonMode()
                    })
                }         
            })
            .catch(err => {
                console.log("Erro no Fetch da Youtube API")
                console.log(err)
            })
        }
    })
}

function saveScratch(){
    chrome.storage.sync.get(['resources'], function(storage) {
        if(currentUrl.includes("scratch.mit.edu/projects/")){
            let project_id = currentUrl.split("projects/")[1]
            project_id = project_id.split(project_id.slice(-1))[0]
            console.log(project_id)
            console.log("api.scratch.mit.edu/projects/" + project_id)

            fetch("https://api.scratch.mit.edu/projects/" + project_id)
            .then((response) => {
                return response.json()
            })
            .then((result) => {
                let newResource = {
                    title: result.title,
                    projectId: result.id,
                    link: currentUrl,
                    instructions: result.instructions,
                    description: result.description,
                    project_token: result.project_token
                }
                return newResource;
            })
            .then((newResource) => {
                if(storage.resources && storage.resources.length > 0){
                    chrome.storage.sync.set({'resources': [...storage.resources, newResource]}, function() {
                        paragraph.textContent = 'Salvo com sucesso'
                        deleteButtonMode()
                    })
                }else{
                    chrome.storage.sync.set({'resources': [newResource]}, function() {
                        paragraph.textContent = 'Salvo com sucesso'
                        deleteButtonMode()
                    })
                }         
            })
            .catch(err => {
                console.log("Erro no Fetch da API Scratch")
                console.log(err)
            })
        }
    })
}

function saveKhanAcademy(){
    // in future
}

function save(){
    chrome.storage.sync.get(['resources'], function(storage) {
        switch(currentSrc) {
        case "youtube.com":
            saveYoutube()
                break;
        case "scratch.mit.edu":
            saveScratch()
                break;
        /*case "khanacademy.org":
            saveKhanAcademy()*/
        default:
            saveUnsupported()
                break;
        }
    })
}

document.addEventListener('DOMContentLoaded', ()=>{
    chrome.storage.sync.get(['resources'], function(result) {
        chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
            currentUrl = tabs[0].url

            // Análise no arquivo supported.json e armazenamento da fonte do recurso

            fetch("supported.json")
            .then(response => response.json())
            .then(
            json => {
                if(json.working.some(element => {
                    if(currentUrl.includes(element)){
                        currentSrc = element            
                        console.log(currentSrc)
                        return true
                    }
                        else return false
                    })){
                        signal_popup.src ="images/verified.png"
                        signal_popup.title ="Este recurso é otimizado pelo ReaCloud!"
                    }
                else if(json.developing.some(element => {
                    if(currentUrl.includes(element)){
                        currentSrc = element            
                        console.log(currentSrc)
                        return true
                    }
                        else return false
                    })){
                        signal_popup.src = "images/developing.png"
                        signal_popup.title = "O suporte a este recurso está em desenvolvimento"
                    }
            })

            if(result.resources && result.resources.length > 0){
                if(result.resources.some(element => element.link === currentUrl)){
                    deleteButtonMode()
                    paragraph.textContent = 'Essa página já foi salva, entre no seu painel do ReaCloud para administrar ou exclua o recurso.'
                }else{
                    button.addEventListener('click', save)
                }
            }else{
                button.addEventListener('click', save)
            }
        })
    })
})
