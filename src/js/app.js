import $ from 'jquery';
import {substitute,getMapFromInput,paintMePlease} from './code-analyzer';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let input_vector = getMapFromInput($('#codePlaceholder1').val());
        let substituted = substitute(codeToParse);
        let painted = paintMePlease(substituted,input_vector);
        $('#parsedCode').html(painted);
    });
});
