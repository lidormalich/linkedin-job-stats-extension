(function() {
    'use strict';



    // פונקציה לחיפוש נתונים
    function extractJobStats(data) {
        let applies = 0;
        let views = 0;

        // פונקציה רקורסיבית לחיפוש נתונים
        function searchInObject(obj, depth = 0, path = '') {
            if (!obj || depth > 15 || typeof obj !== 'object') return;

            for (const [key, value] of Object.entries(obj)) {
                const currentPath = path ? `${path}.${key}` : key;
                
                // הרחבת החיפוש לשמות שדות נוספים
                if ((key === 'applies' || key === 'numApplicants' || key === 'applicationCount' || 
                     key === 'applicants' || key === 'candidates' || key === 'submissions' ||
                     key === 'totalApplications' || key === 'applicationTotal') && 
                    typeof value === 'number' && value > 0) {
                    applies = Math.max(applies, value);
                }
                
                // הרחבת החיפוש לשמות שדות נוספים
                if ((key === 'views' || key === 'viewCount' || key === 'numViews' || 
                     key === 'viewers' || key === 'impressions' || key === 'clicks' ||
                     key === 'totalViews' || key === 'viewTotal') && 
                    typeof value === 'number' && value > 0) {
                    views = Math.max(views, value);
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
            
            const stats = extractJobStats(data);
            
            if (stats.applies >= 0 || stats.views > 0) { // שינוי: >= 0 במקום > 0
                window.postMessage({
                    type: 'JOB_STATS_FOUND',
                    stats: stats,
                    source: 'injected.js'
                }, '*');
            }
            
        } catch (parseErr) {
            
            // חיפוש בטקסט עם יותר דפוסים
            const patterns = [
                /"(?:applies|numApplicants|applicationCount|applicants|candidates|submissions)"\s*:\s*(\d+)/g,
                /"(?:views|viewCount|numViews|viewers|impressions|clicks)"\s*:\s*(\d+)/g,
                /applicants?\s*[\"']?\s*:\s*[\"']?(\d+)/gi,
                /views?\s*[\"']?\s*:\s*[\"']?(\d+)/gi,
                /candidates?\s*[\"']?\s*:\s*[\"']?(\d+)/gi,
                /impressions?\s*[\"']?\s*:\s*[\"']?(\d+)/gi
            ];
            
            let applies = 0;
            let views = 0;
            
            patterns.forEach((pattern, index) => {
                let match;
                while ((match = pattern.exec(responseText)) !== null) {
                    const value = parseInt(match[1]);
                    if (value > 0 && value < 1000000) { // הגבלה למספרים הגיוניים
                        if (index < 3) { // applies patterns
                            applies = Math.max(applies, value);
                        } else { // views patterns
                            views = Math.max(views, value);
                        }
                    }
                }
            });

            if (applies >= 0 || views > 0) { // שינוי: >= 0 במקום > 0
                window.postMessage({
                    type: 'JOB_STATS_FOUND',
                    stats: { applies, views },
                    source: 'injected.js'
                }, '*');
            }
        }
    }

    // יירוט fetch requests
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const url = args[0];
        // הרחבת היירוט לכל הבקשות הרלוונטיות למשרות
        const shouldIntercept = url && (
            url.includes('voyager/api/jobs/jobPostings') ||
            url.includes('voyager/api/jobs') ||
            url.includes('/jobs/') ||
            url.includes('jobPostings') ||
            url.includes('jobDetails')
        );
        
        return originalFetch.apply(this, args)
            .then(response => {
                if (shouldIntercept && response && response.status === 200) {
                    response.clone().text().then(text => {
                        processResponse(text, url);
                    }).catch(err => {
                        // שגיאה בקריאת טקסט
                    });
                }
                
                return response;
            })
            .catch(err => {
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
            // הרחבת היירוט לכל הבקשות הרלוונטיות למשרות
            const shouldIntercept = this._url && (
                this._url.includes('voyager/api/jobs/jobPostings') ||
                this._url.includes('voyager/api/jobs') ||
                this._url.includes('/jobs/') ||
                this._url.includes('jobPostings') ||
                this._url.includes('jobDetails')
            );
            
            if (shouldIntercept && this.status === 200) {
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
                    

                    
                    if (typeof responseData === 'string' && responseData.length > 100) {
                        processResponse(responseData, this._url);
                    }
                    
                } catch (err) {
                    // ניסיון אחרון - להשתמש בresponse ישירות
                    try {
                        const fallbackData = this.response;
                        
                        if (typeof fallbackData === 'string' && fallbackData.length > 100) {
                            processResponse(fallbackData, this._url);
                        }
                    } catch (fallbackErr) {
                        // גם fallback נכשל
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
            window.postMessage({
                type: 'CONNECTION_OK',
                timestamp: Date.now()
            }, '*');
        }
    });

})();