/**
 *  telewizjada plugin for Movian
 *
 *  Copyright (C) 2015 Pisek
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 *  
 */


(function(plugin) {
    var PREFIX = plugin.getDescriptor().id;
    var LOGO = plugin.path + "logo.png";
    var BACKGROUND = plugin.path + "views/img/background.jpg";
	
	var BASE_URL = "http://www.telewizjada.net";
	var BASE_ID_PREFIX = "2014tv";
	var MAX_DESC_LENGHT = 180;
    
    var blue = '6699CC', orange = 'FFA500', red = 'EE0000', green = '008B45', yellow = 'FFFF00';

    function colorStr(str, color) {
        return '<font color="' + color + '">' + str + '</font>';
    }

    function setPageHeader(page, title, image) {
        if (page.metadata) {
            page.metadata.title = title;
            page.metadata.logo = LOGO;
            if (image) {
            	page.metadata.background = image;
            	page.metadata.backgroundAlpha = 0.3;
            } else {
            	page.metadata.background = BACKGROUND;
            	page.metadata.backgroundAlpha = 0.7;
            }
        }
    }
	
	var service = plugin.createService(plugin.getDescriptor().title, PREFIX + ":start", "video", true, LOGO);
	
	var settings = plugin.createSettings(plugin.getDescriptor().title, LOGO, plugin.getDescriptor().synopsis);
	
    settings.createBool('showEpg', "Show EPG page", false,
    	function(v) {
            service.showEpg = v;
    	}
	);
	
    settings.createBool('showAdult', "Show Adult streams", false,
    	function(v) {
            service.showAdult = v;
    	}
	);

	settings.createInt('epgAdjust', 'Adjust hour of EPG (PS3 timezone does not work in EPG)', 0, -12, 12, 1, 'h',
		function(v) {
            service.epgAdjust = v;
    	}
	);
	
    settings.createBool('showCategories', "Show TV categories (TODO)", false,
    	function(v) {
            service.showCategories = v;
    	}
	);

	function d(c) {
		print(JSON.stringify(c, null, 4));
	}
		
    plugin.addURI(PREFIX + ":start", function(page) {
		setPageHeader(page, plugin.getDescriptor().title);
		page.loading = true;
		
		page.type = "directory";
		page.contents = "movies";
		
		var out = getChannels();
		d(out);
		
		if (!service.showCategories) {
			showChannels(page, out.channels);
		} else {
			
			// TODO
			//out.categories
			
		}
		
		page.loading = false;
	});
	
	plugin.addURI(PREFIX + ":category:(.*)", function(page, category) {
		setPageHeader(page, title);
		page.loading = true;
		
		page.type = "directory";
		page.contents = "movies";
		
		var c = showtime.httpReq(BASE_URL + '/get_channels.php');
		var out = JSON.parse(c);
		
		showChannels(page, findElement(out.categories, 'Categoryid', category).Categorychannels);
		
		page.loading = false;
	});
	
	plugin.addURI(PREFIX + ":epg:(.*):(.*)", function(page, id, title) {
		setPageHeader(page, title);
		page.loading = true;
		
		page.type = "directory";
		page.contents = "movies";
		
		page.appendItem(PREFIX + ':tv:' + id + ':' + title, 'video', {
			title : 'Watch ' + title,
		});
		
		page.appendItem("", "separator", {
            title: 'Epg'
        });
		
		var c = getMainChannel(id);
		var name = c.name;
		
		var epg = getEpg(name.split(BASE_ID_PREFIX)[1])
		for (e in epg) {
			
			var duration = epg[e].endtime - epg[e].starttime;
			var startTime = new Date(epg[e].starttime*1000);
			adjustTime(startTime, service.epgAdjust);
			var fontColor = epg[e].attime ? green : orange;
			
			page.appendPassiveItem('video', null, {
				title : new showtime.RichText(colorStr(getTime(startTime) + ' - ' + epg[e].title, fontColor)),
				description : epg[e].description,
				duration : duration
			});
		}
		
		page.loading = false;
	});
	
    plugin.addURI(PREFIX + ":tv:(.*):(.*)", function(page, id, title) {
		setPageHeader(page, "Searching...");
		page.loading = true;
		
		var metadata = {};
		
		var c = getMainChannel(id);
		var url = c.url;
		setCookie(c.url);
        					  			 	   
		var c = getChannelUrl(id);
		var videoUrl = c.url;
        
        //d(videoUrl);
		
		d(title);
        
		metadata.title = title;
		metadata.sources = [{ url: videoUrl, bitrate: 500 }];
		metadata.canonicalUrl = PREFIX + ":tv:" + id + ':' + title;
		metadata.no_fs_scan = true;
		//d(metadata);
		setPageHeader(page, title);
		page.loading = false;
		page.source = "videoparams:"+showtime.JSONEncode(metadata);
		page.type = "video";
        
    });
    
	function getEpg(name) {
		var c = showtime.httpReq(BASE_URL + '/get_epg.php', {
		    postdata: {
                'channelname': name
            },
            caching: true,
            cacheTime: 1800
		});
		return JSON.parse(c);
	}
    
    function getChannels() {
        var c = showtime.httpReq(BASE_URL + '/get_channels.php', {
		    postdata: {},
            caching: true,
            cacheTime: 1800
		});
		return JSON.parse(c);
    }
    
    function getChannelUrl(id) {
        var c = showtime.httpReq(BASE_URL + '/get_channel_url.php', {
		    postdata: {
                'cid': id
            }
		});
        //d(c.toString());
        return JSON.parse(c);
    }
    
    function setCookie(url) {
		var c = showtime.httpReq(BASE_URL + '/set_cookie.php', {
		    postdata: {
                'url': url
            }
		});	
		//d(c);	
    }
    
    function getMainChannel(id) {
		var c = showtime.httpReq(BASE_URL + '/get_mainchannel.php', {
		    postdata: {
                'cid': id
            },
            caching: true,
            cacheTime: 1800
		});
		return JSON.parse(c);
    }
	
	function findElement(arr, propName, propValue) {
		for (i in arr) {
			if (arr[i][propName] == propValue) {
				return arr[i];
			}
		}

	  // will return undefined if not found; you could return a default instead
	}
	
	function showChannels(page, channels) {
	
		var nextSite = service.showEpg ? 'epg' : 'tv';
		
		for (i in channels) {
			//d(channels[i]);
			
			if (channels[i].online) {
				
				if (!service.showAdult && channels[i].isAdult) {
					continue;
				}
				
				page.appendItem(PREFIX + ':' + nextSite + ':' + channels[i].id + ':' + channels[i].displayName, 'video', {
					title : channels[i].displayName,
					icon : BASE_URL + channels[i].thumb
				});
				
			}
			
		}
	
	}
	
	function adjustTime(date, h) {
		date.setTime(date.getTime() + (h*60*60*1000) );
	}
	
	function getTime(date) {
		return date.getHours() + ':' + addZero(date.getMinutes());
	}
	
	function addZero(i) {
		if (i < 10) {
			i = "0" + i;
		}
		return i;
	}
	
})(this);
