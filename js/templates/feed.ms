<form action="#Post" method="post">
    <textarea name="post"></textarea>
    <input type="submit" value="abschicken"/>
</form>

<form action="#Share" method="post">
    <label for="hostname">Hostname:</label>
    <input type="text" name="hostname" value="www.researchgate.net" />
    <input type="submit" value="share"/>
</form>

<ul>
{{#feed}}
  <li>
      <p>{{{statusnet_html}}}</p>
      <p>{{created_at}} 
          {{#user}}
          {{name}}
          {{/user}}
      </p>
  </li>
{{/feed}}
</ul>

<a href="javascript:window.webkitNotifications.requestPermission();">notification</a>
<a href="#Widget">Widget</a>