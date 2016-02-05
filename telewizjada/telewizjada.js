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

	function d(c) {
		print(JSON.stringify(c, null, 4));
	}
		
    plugin.addURI(PREFIX + ":start", function(page) {
		setPageHeader(page, plugin.getDescriptor().title);
		page.loading = true;
		
		page.type = "directory";
		page.contents = "movies";
		
		var c = showtime.httpReq(BASE_URL + '/get_channels.php');	
		var channels = JSON.parse(c).channels;
		//d(channels);
		
		for (i in channels) {
			//d(channels[i]);
			
			page.appendItem(PREFIX + ':video:' + channels[i].id + ':' + channels[i].url + ':' + channels[i].displayName, 'video', {
				title : channels[i].displayName,
				icon : BASE_URL + channels[i].thumb,
				description : channels[i].description
			});
			
		}
		
		page.loading = false;
	});
    
    plugin.addURI(PREFIX + ":video:(.*):(.*):(.*)", function(page, id, url, title) {
		setPageHeader(page, "Searching...");
		page.loading = true;
		
		var metadata = {};
        					  			 	   
		var c = showtime.httpReq(BASE_URL + '/set_cookie.php', {
		    postdata: {
                'url': url
            }
		});	
		//d(c);						   				 	     		   		 								   	   
																												   								   				 	     		   		 								   	   
        var c = showtime.httpReq(BASE_URL + '/get_channel_url.php', {
		    postdata: {
                'cid': id
            }
		});
        //d(c.toString());
        
		var videoUrl = JSON.parse(c).url;
        //d(videoUrl);
        
		metadata.title = title;
		metadata.sources = [{ url: videoUrl, bitrate: 500 }];
		metadata.canonicalUrl = PREFIX + ":video:" + id + ':' + url + ':' + title;
		metadata.no_fs_scan = true;
		//d(metadata);
		setPageHeader(page, title);
		page.loading = false;
		page.source = "videoparams:"+showtime.JSONEncode(metadata);
		page.type = "video";
        
    });
    
})(this);
