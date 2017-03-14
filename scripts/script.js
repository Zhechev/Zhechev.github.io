
const kinveyBaseUrl = 'https://baas.kinvey.com/';
const kinveyAppKey = "kid_HyyjRRSq";
const kinveyAppSecret = "95c886df6d0f490b95e08008ce44049d";
$('#loggedInUser').text('');
const kinveyAppAuthHeader = {
    'Authorization': 'Basic ' + btoa(kinveyAppKey + ':' + kinveyAppSecret),
};

$('#buttoneditPost').click(editPost);


function showView(viewName) {
    $('main > section').hide();
    $('#' + viewName).show();
}

function showHideMenuLinks() {
    $('#linkHome').show();
    if(sessionStorage.getItem('authToken') == null) {
        $('#textHome').show();
        $('#textHomeLogged').hide();
        $('#linkLogin').show();
        $('#linkRegister').show();
        $('#linkListBooks').hide()
        $('#linkCreateBook').hide();
        $('#linkLogout').hide();
    } else {
        $('#textHome').hide();
        $('#textHomeLogged').show();
        $('#linkLogin').hide();
        $('#linkRegister').hide();
        $('#linkListBooks').show();
        $('#linkCreateBook').show();
        $('#linkLogout').show();
    }
}


function showInfo(message) {
    $('#infoBox').text(message);
    $('#infoBox').show();
    setTimeout(function () {
        $('#infoBox').fadeOut();
    }, 3000);
}

function showError(errorMsg) {
    $('#errorBox').text("Error:" + errorMsg);
    $('#errorBox').show();
}

$(function () {
    showHideMenuLinks();
    showView('viewHome');

    $('#linkHome').click(showHomeView);
    $('#linkLogin').click(showLoginView);
    $('#linkRegister').click(showRegisterView);
    $('#linkListBooks').click(listBooks);
    $('#linkCreateBook').click(showCreateBookView);
    $('#linkLogout').click(logout);

    $('#formLogin').submit(function (e) { e.preventDefault(); login(); });
    $('#formRegister').submit(function (e) { e.preventDefault(); register(); });
    $('#formCreateBook').submit(function (e) { e.preventDefault(); createBook(); });

    $(document).on({
        ajaxStart: function () {
            $('#loadingBox').show();
        },
        ajaxStop: function () {
            $('#loadingBox').hide();
        }
    });
});

function showHomeView() {
    showView('viewHome');

}

function showLoginView() {
    showView('viewLogin');
    $('#formLogin').trigger('reset');
}

function login() {
    const kinveyLoginUrl = kinveyBaseUrl + 'user/' + kinveyAppKey + "/login";

    let userData = {
        username: $('#loginUser').val(),
        password: $('#loginPass').val()
    };
    $.ajax({
        method: 'POST',
        url: kinveyLoginUrl,
        data: userData,
        headers: kinveyAppAuthHeader,
        success: loginSuccess,
        error: handleAjaxError
    });

    function loginSuccess(userInfo) {
        let userAuth = userInfo._kmd.authtoken;
        sessionStorage.setItem('authToken', userAuth);
        saveAuthInSession(userInfo)
        showHideMenuLinks();
        listBooks();
        showInfo('Login successful.');
    }
}

function handleAjaxError(response) {
    let errorMsg = JSON.stringify(response);
    if(response.readyState === 0) {
        errorMsg = "Cannot connect due to network error.";
    }
    if(response.responseJSON && response.responseJSON.description) {
        errorMsg = response.responseJSON.description;
    }
    showError(errorMsg);
}

function showRegisterView() {
    showView('viewRegister');
    $('#formRegister').trigger('reset');
}

function register() {
    const kinveyRegisterUrl = kinveyBaseUrl + "user/" + kinveyAppKey + "/";
    let userData = {
        username: $('#registerUser').val(),
        password: $('#registerPass').val()
    };

    if (userData.username.length != 0) {
        $.ajax({
            method: 'POST',
            url: kinveyRegisterUrl,
            headers: kinveyAppAuthHeader,
            data: userData,
            success: registerSuccess,
            error: handleAjaxError
        });
    }
    else {
        showError('Моля попълнете всички полета')
    }

    function registerSuccess(userInfo) {
        let userAuth = userInfo._kmd.authtoken;
        saveAuthInSession(userInfo)
        sessionStorage.setItem('authToken', userAuth);
        showHideMenuLinks();
        listBooks();
        showInfo('User registration successful.');
    }
}

function listBooks() {
    $('#books').empty();
    showView('viewBooks');

    const kinveyBooksUrl = kinveyBaseUrl + "appdata/" + kinveyAppKey + "/books";

    $.ajax({
        method: 'GET',
        url: kinveyBooksUrl,
        headers: kinveyAuthHeaders(),
        success: loadBooksSuccess,
        error: handleAjaxError
    });

    function loadBooksSuccess(books) {
        showInfo('Posts loaded.');
            for(let book of books) {
                displayPost(book)
            }

        }

}

function saveAuthInSession(userInfo) {
    sessionStorage.setItem("userId", userInfo._id);
    $('#loggedInUser').text("Добре дошли, " + userInfo.username + "!");
}

function displayPost(book) {
    let booksTable = $('<div>')
        .addClass("listBooks");
    if (books.length == 0) {
        $('#books').text("No posts in the library.");
    } else  {
        booksTable.append($('<ul>').append(
            $('<li>').text(book.title + ' ').append($('<span id="spanTime">').text(formatDate(book._kmd.lmt))),
            $('<li>').text(book.content)))
    }
        if (book._acl.creator == sessionStorage.getItem('userId')) {
            booksTable.find('ul')
            .append($('<button id="editButton">Edit</button>').click(function () {
                loadBookForEdit(book._id)
            }))
            .append($('<button id="deleteButton">Delete</button>').click(function () {
                deleteBook(book._id)
            }))
}

        $('#books')
            .append(booksTable)

}

function formatDate(dateISO8601) {
    let date = new Date(dateISO8601);
    if (Number.isNaN(date.getDate()))
        return '';
    return date.getDate() + '.' + padZeros(date.getMonth() + 1) +
        "." + date.getFullYear() + ' ' + date.getHours() + ':' +
        padZeros(date.getMinutes()) + ':' + padZeros(date.getSeconds());

    function padZeros(num) {
        return ('0' + num).slice(-2);
    }
}

function loadBookForEdit(bookId) {
    $.ajax({
        method: "GET",
        url: kinveyBookUrl = kinveyBaseUrl + "appdata/" +
            kinveyAppKey + "/books/" + bookId,
        headers: kinveyAuthHeaders(),
        success: loadBookForEditSuccess,
        error: handleAjaxError
    });
}

function loadBookForEditSuccess(book) {
    $('#id').val(book._id);
    $('#titlee').val(book.title);
    $('#contentt').val(book.content);
    showView('vieweditPost');
}

function editPost(bookId) {
        let bookData = {
            title: $('#titlee').val(),
            content: $('#contentt').val()
        };

    $.ajax({
        method: "PUT",
        url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/books/" + $('#id').val(),
        headers: kinveyAuthHeaders(),
        data: bookData,
        success: listBooks,
        error: handleAjaxError
    });

}

function kinveyAuthHeaders() {
    return{
        "Authorization": "Kinvey " + sessionStorage.getItem("authToken")
    }
}

function deleteBook(bookId) {

    $.ajax({
        method: "DELETE",
        headers: kinveyAuthHeaders(),
        url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/books/" + bookId,
        success: deleteBooksSuccess,
        error: handleAjaxError
    });

    function deleteBooksSuccess() {
        listBooks();
        showInfo('Post Deleted');
    }
}

function showCreateBookView() {
    $('#formCreateBook').trigger('reset');
    showView('viewCreateBook');
}

function createBook() {
    const kinveyBooksUrl = kinveyBaseUrl + "appdata/" + kinveyAppKey + "/books";
    let bookData = {
        title: $('#title').val(),
        content: $('#content').val()
    };

    $.ajax({
        method: 'POST',
        url: kinveyBooksUrl,
        headers: kinveyAuthHeaders(),
        data: bookData,
        success: createBookSuccess,
        error: handleAjaxError
    });

    function createBookSuccess(response) {
        listBooks();
        showInfo('Post created.')
    }
}

function logout() {
    sessionStorage.clear();
    $('#loggedInUser').text('');
    showHideMenuLinks();
    showView('viewHome');
    showInfo('Succsessful Logout')
}


//validation

 function validate() {
    var unRegex = /^[A-Za-za-zA-Zа-яА-Я0-9'\.\-\s\,]+$/gm;
    if(formRegister.registerUser.value.length==0){
        document.getElementById('errorUser').innerHTML="Моля, попълнете полето!";
        formRegister.registerUser.value="";
        formRegister.registerUser.focus();
    }
    else if(unRegex.test(formRegister.registerUser.value)==false){
        getElementById('errorUser').innerHTML="Моля, въведете валидно име!";
        formRegister.registerUser.value="";
        formRegister.registerUser.focus();
    }
    else{
        document.getElementById('errorUser').innerHTML="";
    }
};

function validatePass() {
    var passRegex = /^.{6,}$/gm;
    if (formRegister.registerPass.value.length == 0) {
        document.getElementById('errorPass').innerHTML = "Моля, попълнете полето!";
        document.formRegister.registerPass.value = "";
        document.formRegister.registerPass.focus();
    }
    else if (passRegex.test(formRegister.registerPass.value) == false) {
        $('#errorPass').text("Моля, въведете валидна парола!Трябва да съдържа поне шест символа.");
        document.formRegister.registerPass.value = "";
        document.formRegister.registerPass.focus();
    }
    else {
        document.getElementById('errorPass').innerHTML = "";
    }
}

function validateEmail() {
        let emailRegex = /^[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$/gm;
        if(formRegister.email.value.length==0){
            document.getElementById('errorEmail').innerHTML="Моля, попълнете полето!";
            document.formRegister.email.value="";
            document.formRegister.email.focus();
        }
        else if(emailRegex.test(formRegister.email.value)==false){
            document.getElementById('errorEmail').innerHTML="Моля, въведете валиден емайл! напр.mitko.jechev@mail.bg";
            document.formRegister.email.value="";
            document.formRegister.email.focus();
        }
        else{
            document.getElementById('errorEmail').innerHTML="";
        }
    }

