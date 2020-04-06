const socket=io()
//elements
const $messageform=document.querySelector('#message-form')
const $messageforminput=$messageform.querySelector('input')
const $messageformbutton=$messageform.querySelector('button')

const $locationform=document.querySelector('#send-location')

const $messages=document.querySelector('#messages')

//templates
const messageTemplate=document.querySelector('#message-template').innerHTML
const locationMessageTemplate=document.querySelector('#location-message-template').innerHTML
const sidebarTemplate=document.querySelector('#sidebar-template').innerHTML


//options
const {username,room}=Qs.parse(location.search, {ignoreQueryPrefix:true})

const autoscroll=()=>{
    //new messge element
    const $newMessage=$messages.lastElementChild
    
    //height of the new message
    const newMessageStyles=getComputedStyle($newMessage)
    const newMessageMargin=parseInt(newMessageStyles.marginBottom)
    const newMessageHeight=$newMessage.offsetHeight+newMessageMargin
    

    //visible height
    const visibleHeight=$messages.offsetHeight

    //height of messages container
    const containerHeight=$messages.scrollHeight

    //how far have i scrolled
    const scrollOffset=$messages.scrollTop+visibleHeight

    if(containerHeight-newMessageHeight<=scrollOffset)
    {
        $messages.scrollTop=$messages.scrollHeight

    }
}

// document.getElementById() 

socket.on('message',(message)=>{
    console.log(message)
    socket.emit('message_recieved')
    const html=Mustache.render(messageTemplate,{
        username:message.username,
        message:message.text,
        createdAt:moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})  
socket.on('locationMessage',(message)=>{
    console.log(message)
    
    const html=Mustache.render(locationMessageTemplate,{
        username:message.username,
        url:message.url,
        createdAt:moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('roomdata',({room,users})=>{
    const html=Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML=html
})

$messageform.addEventListener('submit',(e)=>{
    e.preventDefault()
    $messageformbutton.setAttribute('disabled','disabled')
    let x=e.target.elements.message.value
   
    socket.emit('sendMessage',x,(error)=>{
        
        $messageformbutton.removeAttribute('disabled')
        $messageforminput.value=''
        $messageforminput.focus()

        if(error)
        {
            return console.log(error)
        }
        console.log('message delivered!')
    })
})

$locationform.addEventListener('click',()=>{
    if(!navigator.geolocation)
    {
        return alert('geolocation is not supported on your browser')
    }
    $locationform.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('send_location',{
            latitude:position.coords.latitude,
            longitude:position.coords.longitude
        },()=>{
            
            $locationform.removeAttribute('disabled')
            console.log('location shared')
        })
    })
})


socket.emit('join',{username,room},(error)=>{
    if(error)
    {
        alert(error)
        location.href='/'
    }
})