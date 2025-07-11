// static/js/templates.js
export const templates = {
    diaryHeader: (data) => `
        <div style="font-family: 'Noto Sans Devanagari', Arial, sans-serif; font-size: 15px; max-width: 900px; margin:auto; margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="font-size:13px; line-height:1.4;">
                    अनुसूची 47, प सं0 120 अ<br>
                    आ0 ह0 प सं0 30 अ
                </div>
                <div style="text-align:center; flex:1; margin-top:2px;">
                    <span style="font-size:17px;font-weight:bold;">
                        केस-दैनिकी सं0
                        <span style="display:inline-block; min-width:80px; border-bottom:1px dotted #333; text-align:center;">
                            ${data.case_diary_no}
                        </span>
                    </span>
                    <div style="font-size:14px; margin-top:2px;">
                        (नियम-${data.rule_no})
                    </div>
                </div>
                    <div style="font-size:13px; min-width:110px; text-align:right;">
                        &nbsp;
                    </div>
            </div>
            
            <div style="text-align:right; margin-top: 2px;">
                <span style="display:inline-block; min-width:120px; border-bottom:1px dotted #333;">${data.against_1 || '....................'}</span>
                <span style="margin:0 10px;">बनाम</span>
                <span style="display:inline-block; min-width:120px; border-bottom:1px dotted #333;">${data.against_2 || '....................'}</span>
            </div>
            
            <div style="display: flex; justify-content: flex-end; margin-top: 2px;">
                <div style="text-align:right;">
                    <span>विशेष रिपोर्ट केस सं.</span>
                    <span style="display:inline-block; min-width:100px; border-bottom:1px dotted #333;">${data.special_report_no}</span>
                </div>
            </div>
            
            <div style="margin-top: 12px; font-size:15px;">
                थाना&nbsp;<b>${data.thana || '....................'}</b>&nbsp;&nbsp;
                जिला&nbsp;<b>${data.district || '....................'}</b>&nbsp;&nbsp;
                प्रथम इत्तिला रिपोर्ट सं.&nbsp;<b>${data.fir_number || '....................'}</b>&nbsp;&nbsp;
                तिथि&nbsp;<b>${data.fir_date || '....................'}</b>&nbsp;&nbsp;
                घटना की तिथि और स्थान&nbsp;<b>${data.event_date_place || '...............................................'}</b>&nbsp;&nbsp;
                धाराः&nbsp;<b>${data.sections || '................................................'}</b>
            </div>
            
            <div style="margin-top:12px; border-top:1px solid #333;"></div>
        </div>
                `,

    diaryTable: (data) => `
        <table style="width:100%;margin-top:20px;border-collapse:collapse;table-layout:fixed;">
            ${data.showHeader ? `
            <tr>
                <td style="width:32%;border-top:1px solid #000;border-bottom:1px solid #000;border-left:none;border-right:1px solid #000;vertical-align:top;padding:8px;">
                    <b>किन तिथि को (समय सहित )<br>कार्रवाई की गई, और किन-किन स्थानों को जाकर देखा गया |</b>
                </td>
                <td style="width:68%;border-top:1px solid #000;border-bottom:1px solid #000;border-left:none;border-right:none;vertical-align:top;padding:8px;">
                    <b>अन्वेषण का अभिलेख</b><br>
                    <div>(01)</div>
                </td>
            </tr>
            ` : ''}
            <tr>
                <td style="width:32%;border-top:none;border-bottom:1px solid #000;border-left:none;border-right:1px solid #000;vertical-align:top;padding:8px;">
                    <div style="min-height:400px;margin-top:8px;white-space:pre-wrap;">${data.left || ''}</div>
                </td>
                <td style="width:68%;border-top:none;border-bottom:1px solid #000;border-left:none;border-right:none;vertical-align:top;padding:8px;">
                    <div style="min-height:400px;margin-top:8px;white-space:pre-wrap;">${data.right || ''}</div>
                </td>
            </tr>
        </table>
    `
};