(<any>window)['HTMLCanvasElement'].prototype.getContext = () => {
    return {};
};

import { Question } from 'survey-core';
import { PagePacker } from '../src/page_layout/page_packer';
import { SurveyPDF } from '../src/survey';
import { IPoint, IRect, IDocOptions, DocOptions, DocController } from '../src/doc_controller';
import { FlatSurvey } from '../src/flat_layout/flat_survey';
import { FlatQuestion } from '../src/flat_layout/flat_question';
import { FlatTextbox } from '../src/flat_layout/flat_textbox';
import { FlatCheckbox } from '../src/flat_layout/flat_checkbox';
import { FlatRadiogroup } from '../src/flat_layout/flat_radiogroup';
import { IPdfBrick } from '../src/pdf_render/pdf_brick';
import { TestHelper } from '../src/helper_test';
import { SurveyHelper } from '../src/helper_survey';
import { TextBrick } from '../src/pdf_render/pdf_text';
let __dummy_tx = new FlatTextbox(null, null);
let __dummy_cb = new FlatCheckbox(null, null);
let __dummy_rg = new FlatRadiogroup(null, null);

test('Pack one flat', () => {
    let flats: IRect[] = [TestHelper.defaultRect];
    let packs: IPdfBrick[][] = PagePacker.pack(TestHelper.wrapRectsPage(flats),
        new DocController(TestHelper.defaultOptions));
    TestHelper.equalRect(expect, packs[0][0], TestHelper.defaultRect);
});
test('Pack two flats on two pages', () => {
    let flats: IRect[] = [TestHelper.defaultRect, TestHelper.defaultRect];
    flats[1].yTop += 10 * DocOptions.MM_TO_PT; flats[1].yBot += 10 * DocOptions.MM_TO_PT;
    let options: IDocOptions = TestHelper.defaultOptions;
    options.format = [210, flats[0].yBot / DocOptions.MM_TO_PT + options.margins.bot];
    options.orientation = 'l';
    let packs: IPdfBrick[][] = PagePacker.pack(TestHelper.wrapRectsPage(flats),
        new DocController(options));
    TestHelper.equalRect(expect, packs[0][0], TestHelper.defaultRect);
    TestHelper.equalRect(expect, packs[1][0], TestHelper.defaultRect);
});
test('Long checkbox with indent', async () => {
    let json = {
        questions: [
            {
                type: 'checkbox',
                name: 'box',
                title: 'Snake',
                indent: 3,
                choices: [
                    'azu',
                    'buky',
                    'vede',
                    'glagoli',
                    'dobro'
                ]
            }
        ]
    };
    let checkGap: number = 1.0 + SurveyHelper.GAP_BETWEEN_ROWS;
    let options: IDocOptions = TestHelper.defaultOptions;
    options.format = [210.0, options.margins.top + new DocController(options).
        measureText().height * checkGap * 3.5 / DocOptions.MM_TO_PT + options.margins.bot];
    options.orientation = 'l';
    let survey: SurveyPDF = new SurveyPDF(json, options);
    let flats: IPdfBrick[][] = await FlatSurvey.generateFlats(survey);
    expect(flats.length).toBe(1);
    expect(flats[0].length).toBe(5);
    let packs: IPdfBrick[][] = PagePacker.pack(flats, survey.controller);
    expect(packs.length).toBe(2);
    expect(packs[0].length).toBe(2);
    expect(packs[1].length).toBe(3);
    let leftTopPoint: IPoint = survey.controller.leftTopPoint;
    leftTopPoint.xLeft += survey.controller.measureText(json.questions[0].indent).width;
    TestHelper.equalPoint(expect, packs[0][0], leftTopPoint);
    leftTopPoint.xLeft += survey.controller.measureText().width;
    leftTopPoint.yTop += survey.controller.measureText().height * (1.0 + checkGap) +
        survey.controller.measureText().height * FlatQuestion.CONTENT_GAP_VERT_SCALE;
    TestHelper.equalPoint(expect, packs[0][1], leftTopPoint);
    leftTopPoint.yTop = survey.controller.leftTopPoint.yTop;
    for (let i: number = 0; i < 3; i++) {
        TestHelper.equalPoint(expect, packs[1][i], leftTopPoint);
        leftTopPoint.yTop += survey.controller.measureText().height * checkGap;
    }
});
test('Check two textbox flats sort order', async () => {
    let json = {
        questions: [
            {
                type: 'checkbox',
                name: 'box',
                title: 'Sort',
                choices: [
                    'This',
                    'Very'
                ]
            },
            {
                type: 'text',
                name: 'textbox',
                title: 'Please',
                startWithNewLine: false
            }
        ]
    };
    let survey: SurveyPDF = new SurveyPDF(json, TestHelper.defaultOptions);
    let flats: IPdfBrick[][] = await FlatSurvey.generateFlats(survey);
    expect(flats.length).toBe(1);
    expect(flats[0].length).toBe(3);
    let composite1: IPdfBrick = flats[0][0];
    let composite2: IPdfBrick = flats[0][1];
    let composite3: IPdfBrick = flats[0][2];
    let packs: IPdfBrick[][] = PagePacker.pack(flats, survey.controller);
    expect(packs.length).toBe(1);
    expect(packs[0].length).toBe(3);
    expect(packs[0][0] === composite1).toBe(true);
    expect(packs[0][1] === composite3).toBe(true);
    expect(packs[0][2] === composite2).toBe(true);
});
test('Pack near flats', () => {
    let flats: IRect[] = [
        { xLeft: 10 * DocOptions.MM_TO_PT, xRight: 20 * DocOptions.MM_TO_PT, yTop: 10 * DocOptions.MM_TO_PT, yBot: 20 * DocOptions.MM_TO_PT },
        { xLeft: 20 * DocOptions.MM_TO_PT, xRight: 30 * DocOptions.MM_TO_PT, yTop: 10 * DocOptions.MM_TO_PT, yBot: 20 * DocOptions.MM_TO_PT },
        { xLeft: 10 * DocOptions.MM_TO_PT, xRight: 20 * DocOptions.MM_TO_PT, yTop: 20 * DocOptions.MM_TO_PT, yBot: 30 * DocOptions.MM_TO_PT },
        { xLeft: 20 * DocOptions.MM_TO_PT, xRight: 30 * DocOptions.MM_TO_PT, yTop: 20 * DocOptions.MM_TO_PT, yBot: 30 * DocOptions.MM_TO_PT }
    ];
    let packs: IPdfBrick[][] = PagePacker.pack(TestHelper.wrapRectsPage(flats),
        new DocController(TestHelper.defaultOptions));
    TestHelper.equalRect(expect, packs[0][0],
        { xLeft: 10 * DocOptions.MM_TO_PT, xRight: 20 * DocOptions.MM_TO_PT, yTop: 10 * DocOptions.MM_TO_PT, yBot: 20 * DocOptions.MM_TO_PT });
    TestHelper.equalRect(expect, packs[0][1],
        { xLeft: 20 * DocOptions.MM_TO_PT, xRight: 30 * DocOptions.MM_TO_PT, yTop: 10 * DocOptions.MM_TO_PT, yBot: 20 * DocOptions.MM_TO_PT });
    TestHelper.equalRect(expect, packs[0][2],
        { xLeft: 10 * DocOptions.MM_TO_PT, xRight: 20 * DocOptions.MM_TO_PT, yTop: 20 * DocOptions.MM_TO_PT, yBot: 30 * DocOptions.MM_TO_PT });
    TestHelper.equalRect(expect, packs[0][3],
        { xLeft: 20 * DocOptions.MM_TO_PT, xRight: 30 * DocOptions.MM_TO_PT, yTop: 20 * DocOptions.MM_TO_PT, yBot: 30 * DocOptions.MM_TO_PT });
});
test('Pack near flats new page', () => {
    let flats: IRect[] = [
        { xLeft: 10 * DocOptions.MM_TO_PT, xRight: 20 * DocOptions.MM_TO_PT, yTop: 10 * DocOptions.MM_TO_PT, yBot: 20 * DocOptions.MM_TO_PT },
        { xLeft: 20 * DocOptions.MM_TO_PT, xRight: 30 * DocOptions.MM_TO_PT, yTop: 10 * DocOptions.MM_TO_PT, yBot: 20 * DocOptions.MM_TO_PT },
        { xLeft: 10 * DocOptions.MM_TO_PT, xRight: 20 * DocOptions.MM_TO_PT, yTop: 20 * DocOptions.MM_TO_PT, yBot: 30 * DocOptions.MM_TO_PT },
        { xLeft: 20 * DocOptions.MM_TO_PT, xRight: 30 * DocOptions.MM_TO_PT, yTop: 20 * DocOptions.MM_TO_PT, yBot: 30 * DocOptions.MM_TO_PT },
    ];
    let options: IDocOptions = TestHelper.defaultOptions;
    options.format = [210, flats[0].yBot / DocOptions.MM_TO_PT + options.margins.bot];
    options.orientation = 'l';
    let packs: IPdfBrick[][] = PagePacker.pack(TestHelper.wrapRectsPage(flats),
        new DocController(options));
    TestHelper.equalRect(expect, packs[0][0],
        { xLeft: 10 * DocOptions.MM_TO_PT, xRight: 20 * DocOptions.MM_TO_PT, yTop: 10 * DocOptions.MM_TO_PT, yBot: 20 * DocOptions.MM_TO_PT });
    TestHelper.equalRect(expect, packs[0][1],
        { xLeft: 20 * DocOptions.MM_TO_PT, xRight: 30 * DocOptions.MM_TO_PT, yTop: 10 * DocOptions.MM_TO_PT, yBot: 20 * DocOptions.MM_TO_PT });
    TestHelper.equalRect(expect, packs[1][0],
        { xLeft: 10 * DocOptions.MM_TO_PT, xRight: 20 * DocOptions.MM_TO_PT, yTop: 10 * DocOptions.MM_TO_PT, yBot: 20 * DocOptions.MM_TO_PT });
    TestHelper.equalRect(expect, packs[1][1],
        { xLeft: 20 * DocOptions.MM_TO_PT, xRight: 30 * DocOptions.MM_TO_PT, yTop: 10 * DocOptions.MM_TO_PT, yBot: 20 * DocOptions.MM_TO_PT });
});
test('Unfold compose brick', async () => {
    let json = {
        questions: [
            {
                type: 'text',
                name: 'textbox',
                title: 'I am alone'
            }
        ]
    };
    let options: IDocOptions = TestHelper.defaultOptions;
    options.format = [210, options.margins.top + new DocController(options).
        measureText().height / DocOptions.MM_TO_PT + options.margins.bot];
    options.orientation = 'l';
    let survey: SurveyPDF = new SurveyPDF(json, options);
    let flats: IPdfBrick[][] = await FlatSurvey.generateFlats(survey);
    expect(flats.length).toBe(1);
    expect(flats[0].length).toBe(1);
    let packs: IPdfBrick[][] = PagePacker.pack(flats, survey.controller);
    expect(packs.length).toBe(2);
    expect(packs[0].length).toBe(1);
    expect(packs[1].length).toBe(1);
    TestHelper.equalRect(expect, packs[0][0], await SurveyHelper.createTitleFlat(
        survey.controller.leftTopPoint, <Question>survey.getAllQuestions()[0], survey.controller));
    let textBoxPoint: IPoint = survey.controller.leftTopPoint;
    textBoxPoint.xLeft += survey.controller.measureText().width;
    TestHelper.equalRect(expect, packs[1][0],
        SurveyHelper.createTextFieldRect(textBoxPoint, survey.controller));
});
test('Pack to little page', async () => {
    let json = {
        questions: [
            {
                type: 'text',
                name: 'textbox',
                title: 'I am so big'
            }
        ]
    };
    let options: IDocOptions = TestHelper.defaultOptions;
    options.format = [210, options.margins.top + new DocController(options).
        measureText().height / 2.0 + options.margins.bot];
    options.orientation = 'l';
    let survey: SurveyPDF = new SurveyPDF(json, options);
    let flats: IPdfBrick[][] = await FlatSurvey.generateFlats(survey);
    expect(flats.length).toBe(1);
    expect(flats[0].length).toBe(1);
    let packs: IPdfBrick[][] = PagePacker.pack(flats, survey.controller);
    expect(packs.length).toBe(2);
    expect(packs[0].length).toBe(1);
    expect(packs[1].length).toBe(1);
    survey.controller.fontStyle = 'bold';
    TestHelper.equalRect(expect, packs[0][0], await SurveyHelper.createTextFlat(
        survey.controller.leftTopPoint, null, survey.controller,
        SurveyHelper.getTitleText(<Question>survey.getAllQuestions()[0]), TextBrick));
    survey.controller.fontStyle = 'normal';
    let textBoxPoint: IPoint = survey.controller.leftTopPoint;
    textBoxPoint.xLeft += survey.controller.measureText().width;
    TestHelper.equalRect(expect, packs[1][0],
        SurveyHelper.createTextFieldRect(textBoxPoint, survey.controller));
});
test('Check yTop on new page with panel', async () => {
    let json = {
        elements: [
            {
                type: 'panel',
                name: 'Simple Panel',
                title: 'Panel Title',
                description: 'Panel description',
                innerIndent: 3,
                elements: [
                    {
                        type: 'radiogroup',
                        name: 'car4',
                        title: 'What LONG car are you driving?',
                        isRequired: true,
                        choices: [
                            'Ford',
                            'Vauxhall',
                            'Volkswagen',
                            'Nissan',
                            'Audi',
                            'Mercedes-Benz',
                            'BMW',
                            'car0',
                            'car1',
                            'car2',
                            'car3',
                            'car4',
                            'car5',
                            'car6',
                            'car7',
                            'car8',
                            'car9',
                            'car10',
                            'car11',
                            'car12',
                            'car13',
                            'car14',
                            'car15',
                            'car16',
                            'car17',
                            'car18',
                            'car19',
                            'car20',
                            'car21',
                            'car22',
                            'car23',
                            'car24',
                            'car25',
                            'car26',
                            'car27',
                            'car28',
                            'car29'
                        ],
                        titleLocation: 'top',
                        indent: 4,
                        startWithNewLine: false
                    },
                ]
            },
            {
                type: 'checkbox',
                name: 'car2',
                title: 'What car are YOU driving?',
                isRequired: true,
                choices: ['A', 'B', 'EEE', 'UU'],
                titleLocation: 'left'
            }
        ]
    };
    let survey: SurveyPDF = new SurveyPDF(json, TestHelper.defaultOptions);
    let flats: IPdfBrick[][] = await FlatSurvey.generateFlats(survey);
    let packs: IPdfBrick[][] = PagePacker.pack(flats, survey.controller);
    expect(packs[2][0].yTop).toBeCloseTo(packs[2][1].yTop -
        survey.controller.measureText().height * (1.0 + SurveyHelper.GAP_BETWEEN_ROWS));
});
test('Check adding new page for lack of place before new page', async () => {
    let json = {
        pages: [
            {
                questions: [
                    {
                        titleLocation: 'hidden',
                        type: 'checkbox',
                        name: 'check',
                        choices: ['', '', '']
                    }
                ]
            },
            {
                questions: [
                    {
                        titleLocation: 'hidden',
                        type: 'checkbox',
                        name: 'check',
                        choices: ['']
                    }
                ]
            }
        ]
    };
    let options = {
        fontSize: 16,
        format: [10, 20],
        margins:
        {
            left: 0,
            right: 0,
            top: 0,
            bot: 0

        }
    };
    let survey: SurveyPDF = new SurveyPDF(json, options);
    let flats: IPdfBrick[][] = await FlatSurvey.generateFlats(survey);
    let packs: IPdfBrick[][] = PagePacker.pack(flats, survey.controller);
    expect(packs.length).toBe(3);
    TestHelper.equalRect(expect, flats[0][0], packs[0][0]);
    TestHelper.equalRect(expect, flats[0][1], packs[0][1]);
    TestHelper.equalRect(expect, flats[0][2], SurveyHelper.moveRect(packs[1][0], undefined, 0));
    TestHelper.equalRect(expect, flats[0][2], SurveyHelper.moveRect(packs[1][0], undefined, 0));
    TestHelper.equalRect(expect, flats[1][0], packs[2][0]);
})