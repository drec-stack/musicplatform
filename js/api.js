(function() {
    'use strict';
    
    function APIClient() {
        this.baseUrl = '';
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }
    
    APIClient.prototype.setBaseUrl = function(url) {
        this.baseUrl = url;
    };
    
    APIClient.prototype.setToken = function(token) {
        if (token) {
            this.defaultHeaders['Authorization'] = 'Bearer ' + token;
        } else {
            delete this.defaultHeaders['Authorization'];
        }
    };
    
    APIClient.prototype.request = function(method, url, data, headers) {
        var self = this;
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            var fullUrl = self.baseUrl + url;
            
            xhr.open(method, fullUrl, true);
            
            var allHeaders = Object.assign({}, self.defaultHeaders, headers || {});
            for (var key in allHeaders) {
                xhr.setRequestHeader(key, allHeaders[key]);
            }
            
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        var response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } catch(e) {
                        resolve(xhr.responseText);
                    }
                } else {
                    reject(new Error('Request failed: ' + xhr.status));
                }
            };
            
            xhr.onerror = function() {
                reject(new Error('Network error'));
            };
            
            if (data) {
                xhr.send(JSON.stringify(data));
            } else {
                xhr.send();
            }
        });
    };
    
    APIClient.prototype.get = function(url, headers) {
        return this.request('GET', url, null, headers);
    };
    
    APIClient.prototype.post = function(url, data, headers) {
        return this.request('POST', url, data, headers);
    };
    
    APIClient.prototype.put = function(url, data, headers) {
        return this.request('PUT', url, data, headers);
    };
    
    APIClient.prototype.delete = function(url, headers) {
        return this.request('DELETE', url, null, headers);
    };
    
    // Специальные методы для музыки
    APIClient.prototype.fetchMetadata = function(url) {
        return this.get('https://api.musichub.com/metadata?url=' + encodeURIComponent(url));
    };
    
    APIClient.prototype.searchTrack = function(query) {
        return this.get('https://api.musichub.com/search?q=' + encodeURIComponent(query));
    };
    
    window.api = new APIClient();
})();
