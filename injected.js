(function() {
    'use strict';

    console.log('LIDOR3333 - הסקריפט המוטמע התחיל לרוץ!');

    // פונקציה לחיפוש נתונים
    function extractJobStats(data) {
        let applies = 0;
        let views = 0;

        // פונקציה רקורסיבית לחיפוש נתונים
        function searchInObject(obj, depth = 0, path = '') {
            if (!obj || depth > 15 || typeof obj !== 'object') return;

            for (const [key, value] of Object.entries(obj)) {
                const currentPath = path ? `${path}.${key}` : key;
                
                // חיפוש applies עם שמות שדות שונים
                if ((key === 'applies' || key === 'numApplicants' || key === 'applicationCount' || key === 'applicants') && typeof value === 'number' && value > 0) {
                    applies = Math.max(applies, value);
                    console.log('LIDOR3333 - מצא applies:', value, 'בנתיב:', currentPath);
                }
                
                // חיפוש views עם שמות שדות שונים
                if ((key === 'views' || key === 'viewCount' || key === 'numViews' || key === 'viewers') && typeof value === 'number' && value > 0) {
                    views = Math.max(views, value);
                    console.log('LIDOR3333 - מצא views:', value, 'בנתיב:', currentPath);
                }

                if (typeof value === 'object' && value !== null) {
                    searchInObject(value, depth + 1, currentPath);
                }
            }
        }

        searchInObject(data);
        return { applies, views };
    }

    function processResponse(responseText, sourceUrl) {
        console.log('LIDOR3333 - מעבד תגובה:', sourceUrl);
        console.log('LIDOR3333 - אורך תגובה:', responseText.length);
        console.log('LIDOR3333 - תחילת תגובה:', responseText.substring(0, 500));
        
        // שליחת תגובה גולמית
        window.postMessage({
            type: 'RAW_RESPONSE_RECEIVED',
            rawResponse: responseText,
            sourceUrl: sourceUrl,
            timestamp: Date.now(),
            source: 'injected.js'
        }, '*');

        try {
            const data = JSON.parse(responseText);
            console.log('LIDOR3333 - פרסור הצליח, מחפש נתונים...');
            
            const stats = extractJobStats(data);
            console.log('LIDOR3333 - תוצאות חיפוש:', stats);
            
            if (stats.applies >= 0 || stats.views > 0) { // שינוי: >= 0 במקום > 0
                console.log('LIDOR3333 - שולח נתונים:', stats);
                window.postMessage({
                    type: 'JOB_STATS_FOUND',
                    stats: stats,
                    source: 'injected.js'
                }, '*');
            } else {
                console.log('LIDOR3333 - לא נמצאו נתונים באובייקט');
            }
            
        } catch (parseErr) {
            console.log('LIDOR3333 - שגיאה בפרסור JSON:', parseErr);
            console.log('LIDOR3333 - מנסה חיפוש בטקסט...');
            
            // חיפוש בטקסט עם יותר דפוסים
            const patterns = [
                /"(?:applies|numApplicants|applicationCount|applicants)"\s*:\s*(\d+)/g,
                /"(?:views|viewCount|numViews|viewers)"\s*:\s*(\d+)/g,
                /applicants?\s*[\"']?\s*:\s*[\"']?(\d+)/gi,
                /views?\s*[\"']?\s*:\s*[\"']?(\d+)/gi
            ];
            
            let applies = 0;
            let views = 0;
            
            patterns.forEach((pattern, index) => {
                let match;
                while ((match = pattern.exec(responseText)) !== null) {
                    const value = parseInt(match[1]);
                    if (value > 0) {
                        if (index < 2) { // applies patterns
                            applies = Math.max(applies, value);
                            console.log('LIDOR3333 - מצא applies בטקסט:', value, 'עם pattern:', pattern.source);
                        } else { // views patterns
                            views = Math.max(views, value);
                            console.log('LIDOR3333 - מצא views בטקסט:', value, 'עם pattern:', pattern.source);
                        }
                    }
                }
            });

            console.log('LIDOR3333 - תוצאות חיפוש בטקסט:', { applies, views });

            if (applies >= 0 || views > 0) { // שינוי: >= 0 במקום > 0
                console.log('LIDOR3333 - שולח נתונים מטקסט:', { applies, views });
                window.postMessage({
                    type: 'JOB_STATS_FOUND',
                    stats: { applies, views },
                    source: 'injected.js'
                }, '*');
            } else {
                console.log('LIDOR3333 - לא נמצאו נתונים גם בטקסט');
            }
        }
    }

    // יירוט fetch requests
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const url = args[0];
        const shouldIntercept = url && url.includes('voyager/api/jobs/jobPostings');
        
        if (shouldIntercept) {
            console.log('LIDOR3333 - יירטתי בקשה חשובה:', url);
        }
        
        return originalFetch.apply(this, args)
            .then(response => {
                if (shouldIntercept && response && response.status === 200) {
                    console.log('LIDOR3333 - תגובה התקבלה:', url);
                    
                    response.clone().text().then(text => {
                        processResponse(text, url);
                    }).catch(err => {
                        console.log('LIDOR3333 - שגיאה בקריאת טקסט:', err);
                    });
                }
                
                return response;
            })
            .catch(err => {
                console.log('LIDOR3333 - שגיאה בבקשה:', err);
                throw err;
            });
    };

    // יירוט XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url, ...args) {
        this._url = url;
        this._method = method;
        return originalXHROpen.apply(this, [method, url, ...args]);
    };

    XMLHttpRequest.prototype.send = function(...args) {
        this.addEventListener('load', function() {
            const shouldIntercept = this._url && this._url.includes('voyager/api/jobs/jobPostings');
            
            if (shouldIntercept && this.status === 200) {
                console.log('LIDOR3333 - יירטתי XHR:', this._url);
                
                let responseData;
                
                try {
                    // ניסיון לקבל את הנתונים לפי סוג התגובה
                    if (this.responseType === '' || this.responseType === 'text') {
                        responseData = this.responseText;
                    } else if (this.responseType === 'json') {
                        responseData = JSON.stringify(this.response);
                    } else if (this.responseType === 'blob') {
                        // אם זה blob, נקרא אותו כטקסט
                        const reader = new FileReader();
                        reader.onload = function() {
                            console.log('LIDOR3333 - נתונים מ-blob:', typeof reader.result);
                            if (typeof reader.result === 'string') {
                                processResponse(reader.result, this._url);
                            }
                        }.bind(this);
                        reader.readAsText(this.response);
                        return;
                    } else {
                        responseData = this.response;
                        if (typeof responseData === 'object') {
                            responseData = JSON.stringify(responseData);
                        }
                    }
                    
                    console.log('LIDOR3333 - responseData:', {
                        type: typeof responseData,
                        length: responseData ? responseData.length : 0,
                        responseType: this.responseType,
                        url: this._url
                    });
                    
                    if (typeof responseData === 'string' && responseData.length > 100) {
                        processResponse(responseData, this._url);
                    }
                    
                } catch (err) {
                    console.log('LIDOR3333 - שגיאה בקריאת XHR response:', err);
                    
                    // ניסיון אחרון - להשתמש בresponse ישירות
                    try {
                        const fallbackData = this.response;
                        console.log('LIDOR3333 - fallback data:', {
                            type: typeof fallbackData,
                            isString: typeof fallbackData === 'string',
                            length: fallbackData ? (fallbackData.length || 'no length') : 'null'
                        });
                        
                        if (typeof fallbackData === 'string' && fallbackData.length > 100) {
                            processResponse(fallbackData, this._url);
                        }
                    } catch (fallbackErr) {
                        console.log('LIDOR3333 - גם fallback נכשל:', fallbackErr);
                    }
                }
            }
        });
        
        return originalXHRSend.apply(this, args);
    };

    // בדיקת חיבור
    window.addEventListener('message', function(event) {
        if (event.source !== window) return;
        
        if (event.data.type === 'TEST_CONNECTION') {
            console.log('LIDOR3333 - הודעת בדיקה התקבלה - החיבור עובד!');
            window.postMessage({
                type: 'CONNECTION_OK',
                timestamp: Date.now()
            }, '*');
        }
    });

    console.log('LIDOR3333 - הסקריפט המוטמע מוכן');

})();