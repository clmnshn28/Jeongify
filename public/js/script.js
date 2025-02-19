const searchInput = document.querySelector("#searchInput");
const dropdown = document.querySelector("#dropdown");


// Showing and hiding the dropdown
searchInput.addEventListener('focus',()=>{
    dropdown.style.display = "block";
})

document.addEventListener('click', (event)=>{
    if(!searchInput.contains(event.target) && !dropdown.contains(event.target)){
        dropdown.style.display = "none";
    }
})



// filtering search in dropdown
searchInput.addEventListener('input', ()=>{
    const filterText = searchInput.value.toLowerCase().trim();
    const items = dropdown.querySelectorAll(".dropdown-item");
    const noResults = document.querySelector(".dropdown-item-no-available")

    let hasMatches = false;
    
    items.forEach(item => {
        const trackName = item.querySelector(".dropdown_title").textContent.toLowerCase();

        if(trackName.includes(filterText)){
            item.style.display = "flex";
            hasMatches = true;
        }else{
            item.style.display = "none";
        }

    });

    noResults.style.display = hasMatches ? "none" : "block";
    dropdown.style.display = hasMatches || filterText ? "block" : "none";
})

