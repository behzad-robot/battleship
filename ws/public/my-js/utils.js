//form functions
const idInput = (name, value, extraInfo = {}) =>
{
    var after = extraInfo.after ? '&nbsp;&nbsp;&nbsp;' + extraInfo.after : '';
    return `<div class='form-row'><b>${name}:</b><input type='text' class='form-control m' name='${name}' value='${value}' readonly/>${after}</div>`;
};
const textInput = (name, value, readonly = false) =>
{
    //return ":|";
    readonly = readonly ? "readonly" : "";
    return `<div class='form-row'><b>${name}:</b><input type='text' class='form-control m' name='${name}' value='${value}' ${readonly}/></div>`;
};
const numberInput = (name, value, readonly = false) =>
{
    //return ":|";
    readonly = readonly ? "readonly" : "";
    return `<div class='form-row'><b>${name}:</b><input type='number' class='form-control m' name='${name}' value='${value}' ${readonly}/></div>`;
};
const boolInput = (name, value, readonly = false) =>
{
    var label = name;
    if (typeof name != 'string')
    {
        label = name.label;
        name = name.name;
    }
    readonly = readonly ? 1 : 0;
    value = value ? "checked" : "";
    return `<div class='form-row'><b>${label}:</b><input type='checkbox' class='form-control m' name='${name}' ${value} ${readonly}/></div>`;
}
const passwordInput = (name, value, readonly = false) =>
{
    //return ":|";
    readonly = readonly ? "readonly" : "";
    return `<div class='form-row'><b>${name}:</b><input type='password' class='form-control m' name='${name}' value='${value}' ${readonly}/></div>`;
};
const hiddenInput = (name, value, readonly = false) =>
{
    //return ":|";
    readonly = readonly ? "readonly" : "";
    return `<input type='hidden' class='form-control m' name='${name}' value='${value}' ${readonly}/>`;
};
const bodyInput = (name, value, readonly = false) =>
{
    readonly = readonly ? "readonly" : "";
    setTimeout(function ()
    {
        $(`textarea[name=${name}`).froalaEditor({ toolbarInline: false, height: 300 });
    }, 300);
    return `<div class='form-row'><b>${name}:</b><textarea editor="true" class='form-control m' name='${name}' ${readonly}>${value}</textarea></div>`;
};
const jsonInput = (name, value, readonly = false) =>
{
    readonly = readonly ? "readonly" : "";
    if (typeof value != 'string')
        value = JSON.stringify(value);
    return `<div class='form-row'><b>${name}:</b><textarea class='form-control m' name='${name}' ${readonly}>${value}</textarea></div>`;
};
const imageInput = (name, value) =>
{
    let img = (value != null && value != '')
        ? `<img src='${value}' width='64px' />` + `<a class='small-link' href='${value}'>${value}</a>`
        : '';
    return `<div class='form-row'><b>${name}:</b><input type='file' class='form-control m' name='${name}'/>&nbsp;&nbsp;` + img + `</div>`;
}
const fileInput = (name, value) =>
{
    let img = (value != null && value != '')
        ? `<a class='small-link' href='${value}'>${value}</a>`
        : '';
    return `<div class='form-row'><b>${name}:</b><input type='file' class='form-control m' name='${name}'/>&nbsp;&nbsp;` + img + `</div>`;
}
// values:{value:string,title:string}
const dropDown = (name, values, value = '') =>
{
    let str = `<div class='form-row'><b>${name}:</b><select class='form-control m' name='${name}'>`;
    str = str + `<option value=''></option>`;
    if (typeof values[0] == 'string')
    {
        for (var i = 0; i < values.length; i++)
        {
            let selected = value == values[i] ? 'selected' : '';
            str = str + `<option value='${values[i]}' ${selected}>${values[i]}</option>`;
        }
    }
    else
    {
        //TODO
        for (var i = 0; i < values.length; i++)
        {
            let selected = value == values[i].value ? 'selected' : '';
            str = str + `<option value='${values[i].value}' ${selected}>${values[i].title}</option>`;
        }
    }
    str = str + '</select></div>';
    return str;
};



const submitBtn = (text = 'Save') =>
{
    return `<input type="submit" class="btn btn-lg btn-success" value="${text}" />`;
}
const initEditors = () =>
{
    //$('textarea[input=name').froalaEditor({toolbarInline: false})
}
const mediaItemBox = (media, onClick = '') =>
{
    return `<div class='col-md-3'><div class='media-item-box' path='${media.path}'>` +
        `<a href='${media.url}' class='thumbnail' style='background-image:url("${media.url}")'></a>` +
        `<div onclick='${onClick}("${media.path}")' class='btn btn-md btn-warning'>Remove</div>` +
        `</div></div>`;
}
//media functions:
const loadMedia = (url, next) =>
{
    if (url.indexOf('http') == -1)
    {
        $.get({
            url: API.media(url),
            success: function (data)
            {
                //console.log(data);
                let result = JSON.parse(data);
                next(result);
            }
        });
    }
    else
    {
        next({ url: url });
    }
};
